import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppState } from '../types/finance';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore (using specific database ID if specified)
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

let currentUser: User | null = null;
let isFirestoreOnline = false;
let authInitializedPromise: Promise<User | null> | null = null;

// Track status listeners
type StatusListener = (status: {
  online: boolean;
  user: User | null;
  lastSynced: Date | null;
}) => void;
const statusListeners = new Set<StatusListener>();
let lastSyncedTime: Date | null = null;

function notifyStatus() {
  const payload = {
    online: isFirestoreOnline,
    user: currentUser,
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
    lastSynced: lastSyncedTime,
  });
  return () => {
    statusListeners.delete(listener);
  };
}

// Test connection on boot as mandated by skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isFirestoreOnline = true;
    notifyStatus();
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: the client is currently offline.');
      isFirestoreOnline = false;
    } else {
      // Permission errors or document not found still confirm server reachability
      isFirestoreOnline = true;
    }
    notifyStatus();
  }
}

// Setup Auth and connection check
export function initFirebaseService(): Promise<User | null> {
  if (authInitializedPromise) return authInitializedPromise;

  authInitializedPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        isFirestoreOnline = true;
        notifyStatus();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          isFirestoreOnline = true;
          notifyStatus();
          resolve(cred.user);
        } catch (err) {
          console.warn('Firebase anonymous sign in warning:', err);
          isFirestoreOnline = false;
          notifyStatus();
          resolve(null);
        }
      }
    });

    testConnection();
  });

  return authInitializedPromise;
}

// Synchronize AppState to Firestore
let syncTimeout: any = null;
export async function syncStateToFirestore(state: AppState): Promise<boolean> {
  try {
    if (!currentUser) {
      await initFirebaseService();
    }
    if (!currentUser) return false;

    // Use debounced cloud sync to optimize bandwidth and write limits
    if (syncTimeout) clearTimeout(syncTimeout);

    return new Promise((resolve) => {
      syncTimeout = setTimeout(async () => {
        try {
          if (!currentUser) {
            resolve(false);
            return;
          }
          const userDocRef = doc(db, 'users', currentUser.uid, 'finance', 'state');
          await setDoc(
            userDocRef,
            {
              ownerId: currentUser.uid,
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
          isFirestoreOnline = false;
          notifyStatus();
          resolve(false);
        }
      }, 500);
    });
  } catch (err) {
    console.error('Firestore sync error:', err);
    return false;
  }
}

// Load AppState from Firestore if exists
export async function loadStateFromFirestore(): Promise<Partial<AppState> | null> {
  try {
    const user = currentUser || (await initFirebaseService());
    if (!user) return null;

    const userDocRef = doc(db, 'users', user.uid, 'finance', 'state');
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.wallets) && Array.isArray(data.transactions)) {
        isFirestoreOnline = true;
        lastSyncedTime = new Date();
        notifyStatus();
        return {
          wallets: data.wallets,
          transactions: data.transactions,
          activeWalletId: data.activeWalletId || undefined,
        };
      }
    }
    return null;
  } catch (err) {
    console.warn('Could not load state from Firestore:', err);
    return null;
  }
}
