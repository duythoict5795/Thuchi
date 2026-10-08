import React, { useState } from 'react';
import { AlertCircle, ExternalLink, Copy, Check, X, ShieldAlert, ArrowRight, Smartphone } from 'lucide-react';
import { AuthErrorDetails } from '../services/firebase';

interface AuthHelpModalProps {
  isOpen: boolean;
  errorDetails: AuthErrorDetails | null;
  onClose: () => void;
  onRetryRedirect?: () => void;
}

export const AuthHelpModal: React.FC<AuthHelpModalProps> = ({
  isOpen,
  errorDetails,
  onClose,
  onRetryRedirect,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !errorDetails) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              {errorDetails.isSafariSpecific ? (
                <Smartphone className="w-5 h-5 text-indigo-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800 leading-tight">
                {errorDetails.title}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Mã lỗi: {errorDetails.code}
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

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 leading-relaxed">
          {errorDetails.explanation}
        </div>

        {/* Current Domain Box with Copy */}
        {errorDetails.code === 'auth/unauthorized-domain' && (
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
            <span className="text-[11px] font-semibold text-indigo-900 block">
              Tên miền của bạn cần thêm vào Firebase:
            </span>
            <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-indigo-200">
              <span className="font-mono text-xs text-slate-800 font-bold truncate">
                {currentHostname}
              </span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Action Steps */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Hướng dẫn khắc phục:
          </span>
          <div className="space-y-2">
            {errorDetails.solutionSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Links or Actions */}
        <div className="pt-2 space-y-2">
          {errorDetails.link && (
            <a
              href={errorDetails.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-colors"
            >
              <span>{errorDetails.link.label}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {onRetryRedirect && errorDetails.code === 'auth/popup-blocked' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetryRedirect();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-colors"
            >
              <span>Thử Đăng nhập Bằng Chuyển hướng (Redirect)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Đã hiểu, đóng thông báo
          </button>
        </div>

        <div className="pt-1 text-[11px] text-slate-400 text-center">
          Dữ liệu của bạn luôn được lưu an toàn trên máy và đồng bộ đám mây liên tục.
        </div>
      </div>
    </div>
  );
};
