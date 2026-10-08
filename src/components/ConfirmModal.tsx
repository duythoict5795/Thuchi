import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, Info } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-rose-600" />;
      case 'warning':
        return <RotateCcw className="w-6 h-6 text-amber-600" />;
      case 'info':
      default:
        return <AlertTriangle className="w-6 h-6 text-indigo-600" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 border-rose-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      case 'info':
      default:
        return 'bg-indigo-50 border-indigo-100';
    }
  };

  const getConfirmBtnClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25';
      case 'info':
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="space-y-1 pt-0.5">
            <h4 className="text-base font-bold text-slate-800 leading-snug">
              {title}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] ${getConfirmBtnClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
