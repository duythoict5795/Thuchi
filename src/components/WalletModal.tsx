import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Wallet } from '../types/finance';
import { formatNumber, parseFormattedNumber } from '../utils/storage';
import { WalletIcon } from './WalletIcon';
import { WALLET_GRADIENTS, getWalletGradient } from '../utils/gradients';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (walletData: Partial<Wallet>, isEdit: boolean) => void;
  walletToEdit?: Wallet | null;
  existingWallets: Wallet[];
}

const ICON_OPTIONS: Wallet['icon'][] = [
  'wallet',
  'landmark',
  'smartphone',
  'credit-card',
  'piggy-bank',
  'briefcase',
];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSave,
  walletToEdit,
  existingWallets,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<Wallet['icon']>('wallet');
  const [color, setColor] = useState(WALLET_GRADIENTS[0].color);
  const [balanceDisplay, setBalanceDisplay] = useState('0');
  const [description, setDescription] = useState('');
  const [cloneFromWalletId, setCloneFromWalletId] = useState<string>('default');

  useEffect(() => {
    if (walletToEdit) {
      setName(walletToEdit.name);
      setIcon(walletToEdit.icon);
      setColor(walletToEdit.color);
      setBalanceDisplay(formatNumber(walletToEdit.initialBalance));
      setDescription(walletToEdit.description || '');
      setCloneFromWalletId('none');
    } else {
      setName('');
      setIcon('wallet');
      setColor(WALLET_GRADIENTS[Math.floor(Math.random() * WALLET_GRADIENTS.length)].color);
      setBalanceDisplay('0');
      setDescription('');
      setCloneFromWalletId(existingWallets.length > 0 ? existingWallets[0].id : 'default');
    }
  }, [walletToEdit, isOpen, existingWallets]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initialBalance = parseFormattedNumber(balanceDisplay);

    let incomeCategories = walletToEdit?.incomeCategories || ['Lương', 'Thưởng', 'Thu nhập khác'];
    let expenseGroups = walletToEdit?.expenseGroups || [
      {
        id: `cg-${Date.now()}-1`,
        name: 'Ăn uống & Sinh hoạt',
        color: '#f87171',
        categories: ['Ăn uống', 'Mua sắm', 'Hóa đơn'],
      },
    ];

    // If creating a new wallet and user chose to clone categories from an existing wallet:
    if (!walletToEdit && cloneFromWalletId !== 'default' && cloneFromWalletId !== 'none') {
      const source = existingWallets.find((w) => w.id === cloneFromWalletId);
      if (source) {
        incomeCategories = [...source.incomeCategories];
        expenseGroups = source.expenseGroups.map((g) => ({
          ...g,
          id: `cg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          categories: [...g.categories],
        }));
      }
    }

    onSave(
      {
        id: walletToEdit ? walletToEdit.id : `w-${Date.now()}`,
        name: name.trim(),
        icon,
        color,
        initialBalance,
        description: description.trim(),
        incomeCategories,
        expenseGroups,
      },
      !!walletToEdit
    );

    onClose();
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setBalanceDisplay(formatNumber(rawDigits ? parseInt(rawDigits, 10) : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ background: getWalletGradient(color) }}
            >
              <WalletIcon icon={icon} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {walletToEdit ? 'Chỉnh sửa Ví' : 'Tạo Ví Mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {walletToEdit ? 'Cập nhật thông tin và số dư' : 'Thêm tài khoản quản lý độc lập'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Wallet Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Tên Ví / Tài Khoản <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Tiền mặt, MB Bank, ZaloPay, Tiết kiệm..."
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Initial Balance */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Số dư ban đầu (₫)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={balanceDisplay}
                onChange={handleBalanceChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-right text-slate-800 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                VND
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Số dư thực tế tại thời điểm bắt đầu theo dõi ví này.
            </p>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Biểu tượng
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setIcon(item)}
                  className={`h-11 rounded-xl flex items-center justify-center transition-all ${
                    icon === item
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <WalletIcon icon={item} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Color / Gradient Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Màu Gradient Đại Diện
            </label>
            <div className="grid grid-cols-6 gap-2">
              {WALLET_GRADIENTS.map((item) => {
                const isSelected =
                  color === item.color || color === item.gradient;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setColor(item.color)}
                    title={item.label}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-2xs hover:scale-105 ${
                      isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                    }`}
                    style={{ background: item.gradient }}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-white stroke-[3] drop-shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Mô tả / Mục đích sử dụng
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Chi tiêu ăn uống, Tiết kiệm mua xe..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* If creating new wallet: category setup option */}
          {!walletToEdit && existingWallets.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Khởi tạo danh mục chi tiêu cho ví này
              </label>
              <select
                value={cloneFromWalletId}
                onChange={(e) => setCloneFromWalletId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="default">Bộ danh mục chuẩn (Mặc định)</option>
                {existingWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    Sao chép danh mục từ ví "{w.name}"
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Sau khi tạo, bạn có thể tự do thêm bớt danh mục riêng cho ví này ở mục Cài đặt.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              {walletToEdit ? 'Lưu thay đổi' : 'Tạo Ví Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
