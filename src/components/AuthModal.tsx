import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  resetPasswordEmail,
  loginWithGoogle,
  parseAuthError,
  AuthErrorDetails,
} from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<AuthErrorDetails | null>(null);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorDetails(null);
    setResetSentSuccess(false);
  };

  const handleTabSwitch = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);
    setResetSentSuccess(false);

    if (!email.trim()) {
      setErrorDetails({
        code: 'validation/empty-email',
        originalMessage: '',
        title: 'Vui lòng nhập email',
        explanation: 'Địa chỉ email không được để trống.',
        solutionSteps: ['Vui lòng điền địa chỉ email của bạn.'],
      });
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await resetPasswordEmail(email);
        setResetSentSuccess(true);
      } catch (err: any) {
        setErrorDetails(parseAuthError(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorDetails({
        code: 'validation/empty-password',
        originalMessage: '',
        title: 'Vui lòng nhập mật khẩu',
        explanation: 'Mật khẩu không được để trống.',
        solutionSteps: ['Vui lòng nhập mật khẩu tài khoản.'],
      });
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorDetails({
          code: 'auth/weak-password',
          originalMessage: '',
          title: 'Mật khẩu quá ngắn',
          explanation: 'Mật khẩu tài khoản cần có ít nhất 6 ký tự để đảm bảo an toàn.',
          solutionSteps: ['Vui lòng đặt mật khẩu có từ 6 ký tự trở lên.'],
        });
        return;
      }

      if (password !== confirmPassword) {
        setErrorDetails({
          code: 'validation/password-mismatch',
          originalMessage: '',
          title: 'Mật khẩu xác nhận không khớp',
          explanation: 'Mật khẩu và ô xác nhận lại mật khẩu phải giống nhau.',
          solutionSteps: ['Vui lòng kiểm tra và nhập lại ô xác nhận mật khẩu.'],
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const user = await loginWithEmail(email, password);
        onSuccess(user.email || email);
        onClose();
      } else {
        const user = await registerWithEmail(email, password, displayName);
        onSuccess(user.email || email);
        onClose();
      }
    } catch (err: any) {
      setErrorDetails(parseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorDetails(null);
    try {
      const user = await loginWithGoogle(false);
      if (user) {
        onSuccess(user.email || 'Google User');
        onClose();
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorDetails(parseAuthError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {mode === 'login' ? 'Đăng Nhập Tài Khoản' : mode === 'register' ? 'Tạo Tài Khoản Mới' : 'Quên Mật Khẩu'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Lưu và đồng bộ dữ liệu thu chi lên Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers: Đăng nhập vs Đăng ký */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng ký mới</span>
            </button>
          </div>
        )}

        {/* Error notification banner */}
        {errorDetails && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-800">{errorDetails.title}</p>
                <p className="text-[11px] leading-relaxed text-rose-700">{errorDetails.explanation}</p>
              </div>
            </div>

            {errorDetails.code === 'auth/operation-not-allowed' && (
              <div className="pt-1.5 border-t border-rose-200/80">
                <a
                  href="https://console.firebase.google.com/project/symmetric-celerity-b48x0/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors"
                >
                  <span>Bật Email/Password trong Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Reset Email Sent Banner */}
        {resetSentSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Đã gửi liên kết đặt lại mật khẩu!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam) của email <strong>{email}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Tên hiển thị (Tùy chọn)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Mật khẩu
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('forgot')}
                    className="text-[10px] font-semibold text-indigo-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : 'Nhập mật khẩu'}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Xác nhận lại mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu trên"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span className="inline-block animate-pulse">Đang xử lý...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập ngay</span>
              </>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Đăng ký tài khoản</span>
              </>
            ) : (
              <span>Gửi liên kết lấy lại mật khẩu</span>
            )}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Quay lại Đăng nhập
            </button>
          )}
        </form>

        {/* Separator & Google Sign-In */}
        {mode !== 'forgot' && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="relative text-center my-1">
              <span className="bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hoặc
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </button>
          </div>
        )}

        <div className="text-[10px] text-slate-400 text-center pt-1 leading-relaxed">
          Tài khoản email & mật khẩu được bảo vệ bởi Firebase Auth. Hoạt động trơn tru trên màn hình chính iPhone & Safari.
        </div>
      </div>
    </div>
  );
};
