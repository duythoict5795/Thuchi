import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Transaction, Wallet } from '../types/finance';
import { formatNumber, parseFormattedNumber } from '../utils/storage';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
  transaction: Transaction | null;
  wallets: Wallet[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  wallets,
}) => {
  const [type, setType] = useState<Transaction['type']>('expense');
  const [amountDisplay, setAmountDisplay] = useState('0');
  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmountDisplay(formatNumber(transaction.amount));
      setWalletId(transaction.walletId);
      setToWalletId(transaction.toWalletId || (wallets.find((w) => w.id !== transaction.walletId)?.id || ''));
      setCategory(transaction.category);
      setNote(transaction.note);
      setDate(transaction.date);
      setFormError(null);
    }
  }, [transaction, isOpen, wallets]);

  if (!isOpen || !transaction) return null;

  const currentWallet = wallets.find((w) => w.id === walletId) || wallets[0];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const rawDigits = e.target.value.replace(/\D/g, '');
    setAmountDisplay(formatNumber(rawDigits ? parseInt(rawDigits, 10) : 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = parseFormattedNumber(amountDisplay);
    if (amount <= 0) {
      setFormError('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    if (type === 'transfer' && walletId === toWalletId) {
      setFormError('Ví nguồn và ví đích phải khác nhau!');
      return;
    }

    onSave({
      ...transaction,
      type,
      amount,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : undefined,
      category: type === 'transfer' ? 'Chuyển tiền nội bộ' : category,
      note: note.trim(),
      date,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Chỉnh sửa giao dịch</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Selector */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                type === 'expense'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Thu nhập
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                type === 'transfer'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Chuyển tiền
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Số tiền (₫)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={amountDisplay}
              onChange={handleAmountChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-bold text-right text-slate-800 tabular-nums focus:ring-2 focus:ring-indigo-500"
              required
            />
            {/* Quick Amount Suggestion Chips */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 custom-scrollbar">
              {[20000, 25000, 30000, 50000, 1000000, 4000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountDisplay(formatNumber(amt))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 whitespace-nowrap transition-colors"
                >
                  +{amt >= 1000000 ? `${amt / 1000000}Tr` : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Wallets */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Từ Ví
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Đến Ví
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800"
                >
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Ví thanh toán
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category (if not transfer) */}
          {type !== 'transfer' && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Danh mục ({currentWallet ? currentWallet.name : ''})
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800"
                required
              >
                {type === 'income' ? (
                  currentWallet?.incomeCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  currentWallet?.expenseGroups.map((g) => (
                    <optgroup key={g.id} label={g.name}>
                      {g.categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Ngày
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800"
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
                placeholder="Ghi chú chi tiết..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Form Error */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
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
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
