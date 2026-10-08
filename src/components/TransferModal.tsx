import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Wallet, Transaction } from '../types/finance';
import {
  formatVND,
  formatNumber,
  parseFormattedNumber,
  calculateWalletBalance,
  getTodayDateString,
} from '../utils/storage';
import { WalletIcon } from './WalletIcon';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  wallets: Wallet[];
  transactions: Transaction[];
  defaultFromWalletId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onTransfer,
  wallets,
  transactions,
  defaultFromWalletId,
}) => {
  const [fromWalletId, setFromWalletId] = useState<string>(() => {
    if (defaultFromWalletId && defaultFromWalletId !== 'all') return defaultFromWalletId;
    return wallets[0]?.id || '';
  });

  const [toWalletId, setToWalletId] = useState<string>(() => {
    const candidate = wallets.find((w) => w.id !== defaultFromWalletId);
    return candidate?.id || wallets[1]?.id || '';
  });

  const [amountDisplay, setAmountDisplay] = useState('');
  const [note, setNote] = useState('Chuyển tiền nội bộ');
  const [date, setDate] = useState(getTodayDateString());
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen || wallets.length < 2) return null;

  const fromWallet = wallets.find((w) => w.id === fromWalletId) || wallets[0];
  const toWallet = wallets.find((w) => w.id === toWalletId) || wallets[1];

  const fromBalance = calculateWalletBalance(fromWallet.id, wallets, transactions);
  const toBalance = calculateWalletBalance(toWallet.id, wallets, transactions);

  const transferAmount = parseFormattedNumber(amountDisplay);

  const handleSwap = () => {
    setFormError(null);
    const temp = fromWalletId;
    setFromWalletId(toWalletId);
    setToWalletId(temp);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const raw = e.target.value.replace(/\D/g, '');
    setAmountDisplay(raw ? formatNumber(parseInt(raw, 10)) : '');
  };

  const setQuickAmount = (val: number) => {
    setFormError(null);
    setAmountDisplay(formatNumber(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (transferAmount <= 0) {
      setFormError('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }
    if (fromWalletId === toWalletId) {
      setFormError('Ví nguồn và ví đích không được trùng nhau');
      return;
    }

    onTransfer({
      type: 'transfer',
      amount: transferAmount,
      walletId: fromWalletId,
      toWalletId: toWalletId,
      category: 'Chuyển tiền nội bộ',
      note: note.trim() || `Chuyển từ ${fromWallet.name} sang ${toWallet.name}`,
      date,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Chuyển tiền giữa các ví</h3>
              <p className="text-xs text-slate-500">Luân chuyển ngân sách và số dư nội bộ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Visual From -> To Card */}
          <div className="relative p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            {/* From Wallet */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Từ ví nguồn (Trừ tiền)
                </span>
                <span className="text-xs font-semibold text-slate-600 tabular-nums">
                  Hiện có: {formatVND(fromBalance)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-slate-200">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: fromWallet.color }}
                >
                  <WalletIcon icon={fromWallet.icon} className="w-4 h-4" />
                </div>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatVND(calculateWalletBalance(w.id, wallets, transactions))})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1 relative z-10">
              <button
                type="button"
                onClick={handleSwap}
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                title="Đảo chiều chuyển"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* To Wallet */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Đến ví đích (Cộng tiền)
                </span>
                <span className="text-xs font-semibold text-slate-600 tabular-nums">
                  Hiện có: {formatVND(toBalance)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-slate-200">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: toWallet.color }}
                >
                  <WalletIcon icon={toWallet.icon} className="w-4 h-4" />
                </div>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatVND(calculateWalletBalance(w.id, wallets, transactions))})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Số tiền chuyển (₫) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amountDisplay}
              onChange={handleAmountChange}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-bold text-right text-slate-800 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            {/* Quick buttons */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 custom-scrollbar">
              {[20000, 25000, 30000, 50000, 1000000, 4000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setQuickAmount(amt)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 whitespace-nowrap transition-colors"
                >
                  +{amt >= 1000000 ? `${amt / 1000000}Tr` : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Ngày thực hiện
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Ghi chú
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Rút tiền, nạp ví..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Balance Preview */}
          {transferAmount > 0 && (
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>{fromWallet.name} sau chuyển:</span>
                <span className="font-bold tabular-nums text-slate-800">
                  {formatVND(fromBalance - transferAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{toWallet.name} sau chuyển:</span>
                <span className="font-bold tabular-nums text-emerald-700">
                  {formatVND(toBalance + transferAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Error display */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              Xác nhận chuyển
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
