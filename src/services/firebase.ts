import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

// Setup Auth state listener and handle redirect login results (for Safari / iOS PWA)
let authInitializedPromise: Promise<User | null> | null = null;
export function initFirebaseService(): Promise<User | null> {
  if (authInitializedPromise) return authInitializedPromise;

  authInitializedPromise = (async () => {
    // 1. Process redirect result if returning from Google OAuth redirect (Safari / mobile)
    try {
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult?.user) {
        currentUser = redirectResult.user;
        isFirestoreOnline = true;
        notifyStatus();
      }
    } catch (redirectErr: any) {
      console.warn('Firebase redirect result warning:', redirectErr);
    }

    // 2. Listen to continuous auth state
    return new Promise<User | null>((resolve) => {
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
  })();

  return authInitializedPromise;
}

export interface AuthErrorDetails {
  code: string;
  originalMessage: string;
  title: string;
  explanation: string;
  solutionSteps: string[];
  link?: { label: string; url: string };
  isSafariSpecific?: boolean;
}

export function parseAuthError(err: any): AuthErrorDetails {
  const code = err?.code || 'unknown';
  const rawMessage = err?.message || String(err);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = firebaseConfig.projectId;

  if (code === 'auth/unauthorized-domain') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Tên miền chưa được cấp phép trong Firebase',
      explanation: `Tên miền hiện tại "${currentHostname}" chưa được thêm vào Danh sách miền được ủy quyền (Authorized domains) của dự án Firebase (${projectId}). Khi mở trên GitHub Pages hoặc tên miền riêng, Firebase sẽ chặn đăng nhập Google cho đến khi bạn thêm tên miền này vào.`,
      solutionSteps: [
        `Truy cập Firebase Console mục Authentication > Settings của dự án.`,
        `Tại phần "Authorized domains" (Miền được ủy quyền), bấm "Add domain".`,
        `Dán tên miền: ${currentHostname} rồi bấm Save (Lưu).`,
        `Quay lại trang này và bấm nút Đăng nhập Google lại.`,
      ],
      link: {
        label: 'Mở Cài đặt Firebase Console Authorized Domains',
        url: `https://console.firebase.google.com/project/${projectId}/authentication/settings`,
      },
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Safari đã chặn Cửa sổ Pop-up đăng nhập',
      explanation: 'Trình duyệt Safari trên iPhone/iPad hoặc Mac theo mặc định sẽ chặn các cửa sổ pop-up tự mở khi đăng nhập tài khoản Google.',
      solutionSteps: [
        'Cách 1 (Khuyên dùng): Trên iPhone/iPad vào Cài đặt máy > Safari > Tắt mục "Chặn cửa sổ bật lên" (Block Pop-ups).',
        'Cách 2: Trong Cài đặt > Safari > Tắt mục "Ngăn chặn theo dõi qua trang web" (Prevent Cross-Site Tracking).',
        'Cách 3: Sử dụng nút "Thử Đăng nhập Chuyển hướng" bên dưới để chuyển thẳng sang trang Google thay vì mở popup.',
      ],
      isSafariSpecific: true,
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Cửa sổ đăng nhập đã bị đóng',
      explanation: 'Bạn đã đóng cửa sổ Google trước khi hoàn tất đăng nhập tài khoản.',
      solutionSteps: ['Vui lòng bấm lại nút "Đăng nhập Google" và chọn tài khoản của bạn.'],
    };
  }

  if (code === 'auth/cancelled-popup-request') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Yêu cầu đăng nhập bị hủy',
      explanation: 'Có nhiều lần bấm liên tiếp hoặc Safari đã tự động hủy yêu cầu mở cửa sổ xác thực.',
      solutionSteps: ['Vui lòng đợi vài giây và bấm lại nút Đăng nhập Google một lần.'],
      isSafariSpecific: true,
    };
  }

  return {
    code,
    originalMessage: rawMessage,
    title: 'Không thể đăng nhập tài khoản Google',
    explanation: 'Quá trình đăng nhập qua Google gặp sự cố trên trình duyệt. Có thể do Safari chặn cookie bên thứ 3 hoặc lỗi mạng.',
    solutionSteps: [
      'Nếu đang dùng Safari: Vào Cài đặt > Safari > Tắt "Ngăn chặn theo dõi trên mọi trang web" (Prevent Cross-Site Tracking).',
      'Đảm bảo kết nối internet đang hoạt động bình thường.',
      'Ứng dụng vẫn tự động đồng bộ đám mây và lưu trữ ngoại tuyến an toàn mà không cần tài khoản.',
    ],
    isSafariSpecific: true,
  };
}

// Google Login with Safari and iOS PWA compatibility
export async function loginWithGoogle(forceRedirect = false): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const isStandalone = typeof window !== 'undefined' &&
    ((window.navigator as any).standalone === true || window.matchMedia?.('(display-mode: standalone)').matches);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // On iOS standalone PWA or explicit redirect request, use signInWithRedirect (if not in iframe)
  if ((forceRedirect || isStandalone) && !isInIframe) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    isFirestoreOnline = true;
    notifyStatus();
    return result.user;
  } catch (err: any) {
    console.error('Google login error:', err);
    // If popup was blocked in Safari and not in an iframe, attempt transparent redirect
    if ((err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') && !isInIframe) {
      console.log('Falling back to signInWithRedirect due to popup-blocked...');
      await signInWithRedirect(auth, provider);
      return null;
    }
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
