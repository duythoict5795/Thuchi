import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
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

// Track redirect error for surfacing in UI
export let lastRedirectError: any = null;
type AuthErrorListener = (errDetails: AuthErrorDetails) => void;
const authErrorListeners = new Set<AuthErrorListener>();

export function subscribeAuthError(listener: AuthErrorListener): () => void {
  authErrorListeners.add(listener);
  if (lastRedirectError) {
    listener(parseAuthError(lastRedirectError));
  }
  return () => {
    authErrorListeners.delete(listener);
  };
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
      console.error('Firebase redirect result error:', redirectErr);
      lastRedirectError = redirectErr;
      const parsed = parseAuthError(redirectErr);
      authErrorListeners.forEach((fn) => {
        try {
          fn(parsed);
        } catch (e) {
          console.error(e);
        }
      });
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
      title: 'Tên miền chưa được cấp phép trong Firebase (Authorized Domain)',
      explanation: `Tên miền hiện tại "${currentHostname}" chưa được thêm vào Danh sách miền được ủy quyền (Authorized domains) của dự án Firebase (${projectId}).\n\n📌 Đây là lý do vì sao khi mở bên trong AI Studio (tên miền *.run.app) thì đăng nhập được, nhưng khi mở trên Safari/GitHub Pages (${currentHostname}) thì tài khoản không được lưu và tự nhảy về trang chủ!`,
      solutionSteps: [
        `Nhấn vào nút "Mở Cài đặt Firebase Console" bên dưới.`,
        `Tại trang Firebase Console > Authentication > Settings > mục "Authorized domains" (Miền được ủy quyền).`,
        `Nhấn "Add domain" (Thêm miền) và dán tên miền: ${currentHostname}`,
        `Nhấn "Save" (Lưu) rồi quay lại trang này và bấm Đăng nhập Google lại.`,
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
        'Trên iPhone/iPad vào Cài đặt máy (Settings) > Safari > Tắt mục "Chặn cửa sổ bật lên" (Block Pop-ups).',
        'Vào Cài đặt > Safari > Tắt mục "Ngăn chặn theo dõi qua trang web" (Prevent Cross-Site Tracking).',
        'Sau khi tắt, quay lại trang này bấm nút "Đăng nhập Google" lại.',
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

  if (code === 'auth/operation-not-allowed') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Chưa bật đăng nhập Email/Mật khẩu trên Firebase',
      explanation: 'Phương thức xác thực bằng Email/Mật khẩu hiện chưa được kích hoạt trong dự án Firebase của bạn. Cần bật tính năng này để đăng ký tài khoản nội bộ.',
      solutionSteps: [
        'Nhấn vào nút "Bật Email/Password trong Firebase Console" bên dưới.',
        'Tại trang Firebase Console mục Sign-in method, nhấn vào Email/Password.',
        'Bật công tắc Enable đầu tiên và nhấn Save (Lưu).',
        'Quay lại ứng dụng và tiến hành đăng ký/đăng nhập bình thường.',
      ],
      link: {
        label: 'Mở Firebase Console Sign-in method',
        url: `https://console.firebase.google.com/project/${projectId}/authentication/providers`,
      },
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Email này đã được đăng ký',
      explanation: 'Địa chỉ email này đã có tài khoản trên hệ thống. Bạn có thể chuyển sang tab Đăng nhập để sử dụng.',
      solutionSteps: ['Chuyển sang tab Đăng nhập và điền mật khẩu của bạn.'],
    };
  }

  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Sai email hoặc mật khẩu',
      explanation: 'Email hoặc mật khẩu bạn vừa nhập không chính xác. Vui lòng kiểm tra lại.',
      solutionSteps: [
        'Kiểm tra lại phím Caps Lock hoặc gõ lại mật khẩu.',
        'Nếu bạn quên mật khẩu, hãy bấm vào liên kết "Quên mật khẩu?" để nhận email đặt lại.',
      ],
    };
  }

  if (code === 'auth/user-not-found') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Không tìm thấy tài khoản',
      explanation: 'Chưa có tài khoản nào được tạo với địa chỉ email này.',
      solutionSteps: ['Vui lòng chuyển sang tab "Đăng ký mới" để tạo tài khoản trước.'],
    };
  }

  if (code === 'auth/weak-password') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Mật khẩu quá ngắn',
      explanation: 'Mật khẩu cần tối thiểu 6 ký tự để đáp ứng tiêu chuẩn bảo mật.',
      solutionSteps: ['Vui lòng nhập mật khẩu có từ 6 ký tự trở lên.'],
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      code,
      originalMessage: rawMessage,
      title: 'Email không hợp lệ',
      explanation: 'Địa chỉ email bạn nhập không đúng định dạng tiêu chuẩn (ví dụ: ten@gmail.com).',
      solutionSteps: ['Vui lòng kiểm tra lại địa chỉ email.'],
    };
  }

  return {
    code,
    originalMessage: rawMessage,
    title: 'Không thể xác thực tài khoản',
    explanation: 'Quá trình đăng nhập hoặc đăng ký gặp sự cố. Vui lòng kiểm tra kết nối mạng và thử lại.',
    solutionSteps: [
      'Đảm bảo kết nối internet đang hoạt động bình thường.',
      'Dữ liệu vẫn được tự động đồng bộ đám mây và lưu trữ ngoại tuyến an toàn theo thiết bị.',
    ],
    isSafariSpecific: true,
  };
}

// Email/Password Authentication (Hoạt động hoàn hảo trên Safari, Màn hình chính PWA, không phụ thuộc Google OAuth)
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
  currentUser = res.user;
  isFirestoreOnline = true;
  notifyStatus();
  return res.user;
}

export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName && displayName.trim()) {
    try {
      await updateProfile(res.user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn('Could not set displayName:', e);
    }
  }
  currentUser = res.user;
  isFirestoreOnline = true;
  notifyStatus();
  return res.user;
}

export async function resetPasswordEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

// Google Login: Ưu tiên signInWithPopup vì hoạt động tức thì, không bị mất tab hay reload trang
export async function loginWithGoogle(forceRedirect = false): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Nếu người dùng chủ động chọn thử chuyển hướng (Redirect) và không ở trong iframe
  if (forceRedirect && !isInIframe) {
    try {
      localStorage.setItem('qunlthuchi_active_tab', 'settings');
    } catch {}
    await signInWithRedirect(auth, provider);
    return null;
  }

  // Luôn ưu tiên signInWithPopup trước vì popup hoạt động tốt và không bị reload trang
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    isFirestoreOnline = true;
    notifyStatus();
    return result.user;
  } catch (err: any) {
    console.error('Google login error:', err);
    throw err;
  }
}

// User Logout (Dùng cho cả Email và Google)
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
    currentUser = null;
    notifyStatus();
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// Backwards compatibility alias
export const logoutGoogle = logoutUser;

// Synchronize AppState to Firestore
let syncTimeout: any = null;
export async function syncStateToFirestore(state: AppState): Promise<boolean> {
  try {
    if (syncTimeout) clearTimeout(syncTimeout);

    return new Promise((resolve) => {
      syncTimeout = setTimeout(async () => {
        try {
          const deviceId = getDeviceId();
          const activeUser = auth.currentUser || currentUser;
          // If logged in (with Email or Google), save to user document; otherwise save to device sync document
          const docRef = activeUser
            ? doc(db, 'users', activeUser.uid, 'finance', 'state')
            : doc(db, 'device_sync', deviceId, 'finance', 'state');

          await setDoc(
            docRef,
            {
              ownerId: activeUser ? activeUser.uid : deviceId,
              wallets: state.wallets,
              transactions: state.transactions,
              activeWalletId: state.activeWalletId || '',
              summaryWalletIds: state.summaryWalletIds || state.wallets.map((w) => w.id),
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
    const activeUser = auth.currentUser || currentUser;
    let data: any = null;

    // 1. Try loading from authenticated user if logged in (Email or Google)
    if (activeUser) {
      const userDocRef = doc(db, 'users', activeUser.uid, 'finance', 'state');
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
        summaryWalletIds: Array.isArray(data.summaryWalletIds)
          ? (data.summaryWalletIds as string[])
          : (data.wallets as Wallet[]).map((w) => w.id),
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
