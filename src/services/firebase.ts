import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppState, Wallet, Transaction } from '../types/finance';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore (using specific database ID if specified)
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Generate or retrieve persistent device ID for guest cloud sync
export function getDeviceId(): string {
  const key = 'qunlthuchi_device_id';
  let id = '';
  try {
    id = localStorage.getItem(key) || '';
  } catch {
    id = '';
  }
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      localStorage.setItem(key, id);
    } catch {
      // storage unavailable
    }
  }
  return id;
}

let currentUser: User | null = null;
let isFirestoreOnline = true; // Default optimistic while checking
let lastSyncedTime: Date | null = null;

// Track status listeners
export type CloudStatusPayload = {
  online: boolean;
  user: User | null;
  deviceId: string;
  lastSynced: Date | null;
};
type StatusListener = (status: CloudStatusPayload) => void;
const statusListeners = new Set<StatusListener>();

function notifyStatus() {
  const payload: CloudStatusPayload = {
    online: isFirestoreOnline,
    user: currentUser,
    deviceId: getDeviceId(),
    lastSynced: lastSyncedTime,
  };
  statusListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.error('Error notifying cloud status:', err);
    }
  });
}

export function subscribeCloudStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  listener({
    online: isFirestoreOnline,
    user: currentUser,
    deviceId: getDeviceId(),
    lastSynced: lastSyncedTime,
  });
  return () => {
    statusListeners.delete(listener);
  };
}

// Test connection on boot as mandated by skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isFirestoreOnline = true;
    notifyStatus();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: the client is currently offline.');
      isFirestoreOnline = false;
    } else {
      // Server is reachable (even if doc doesn't exist)
      isFirestoreOnline = true;
    }
    notifyStatus();
    return isFirestoreOnline;
  }
}

// Setup Auth state listener
let authInitializedPromise: Promise<User | null> | null = null;
export function initFirebaseService(): Promise<User | null> {
  if (authInitializedPromise) return authInitializedPromise;

  authInitializedPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      isFirestoreOnline = true;
      notifyStatus();
      resolve(user);
    });

    testConnection().then((online) => {
      isFirestoreOnline = online;
      notifyStatus();
    });
  });

  return authInitializedPromise;
}

// Google Login
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    isFirestoreOnline = true;
    notifyStatus();
    return result.user;
  } catch (err) {
    console.error('Google login error:', err);
    throw err;
  }
}

// Google Logout
export async function logoutGoogle(): Promise<void> {
  try {
    await signOut(auth);
    currentUser = null;
    notifyStatus();
  } catch (err) {
    console.error('Google logout error:', err);
  }
}

// Synchronize AppState to Firestore
let syncTimeout: any = null;
export async function syncStateToFirestore(state: AppState): Promise<boolean> {
  try {
    if (syncTimeout) clearTimeout(syncTimeout);

    return new Promise((resolve) => {
      syncTimeout = setTimeout(async () => {
        try {
          const deviceId = getDeviceId();
          // If logged in with Google, save to user document; otherwise save to device sync document
          const docRef = currentUser
            ? doc(db, 'users', currentUser.uid, 'finance', 'state')
            : doc(db, 'device_sync', deviceId, 'finance', 'state');

          await setDoc(
            docRef,
            {
              ownerId: currentUser ? currentUser.uid : deviceId,
              wallets: state.wallets,
              transactions: state.transactions,
              activeWalletId: state.activeWalletId || '',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          lastSyncedTime = new Date();
          isFirestoreOnline = true;
          notifyStatus();
          resolve(true);
        } catch (err) {
          console.error('Failed to sync state to Firestore:', err);
          if (err instanceof Error && err.message.includes('offline')) {
            isFirestoreOnline = false;
          }
          notifyStatus();
          resolve(false);
        }
      }, 300);
    });
  } catch (err) {
    console.error('Firestore sync error:', err);
    return false;
  }
}

// Load AppState from Firestore if exists
export async function loadStateFromFirestore(): Promise<Partial<AppState> | null> {
  try {
    const deviceId = getDeviceId();
    let data: any = null;

    // 1. Try loading from authenticated user if logged in
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid, 'finance', 'state');
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        data = userSnap.data();
      }
    }

    // 2. If no data found yet, try loading from device sync
    if (!data) {
      const devDocRef = doc(db, 'device_sync', deviceId, 'finance', 'state');
      const devSnap = await getDoc(devDocRef);
      if (devSnap.exists()) {
        data = devSnap.data();
      }
    }

    if (data && Array.isArray(data.wallets) && Array.isArray(data.transactions)) {
      isFirestoreOnline = true;
      lastSyncedTime = new Date();
      notifyStatus();
      return {
        wallets: data.wallets as Wallet[],
        transactions: data.transactions as Transaction[],
        activeWalletId: data.activeWalletId || undefined,
      };
    }

    // Connection worked even if document does not exist yet
    isFirestoreOnline = true;
    notifyStatus();
    return null;
  } catch (err) {
    console.warn('Could not load state from Firestore:', err);
    return null;
  }
}
