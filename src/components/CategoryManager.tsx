import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  FolderPlus,
  Copy,
  Check,
  X,
  AlertCircle,
  Layers,
  CheckSquare,
  Square,
  Info,
  CheckCheck,
} from 'lucide-react';
import { Wallet, ExpenseGroup, Transaction } from '../types/finance';
import { WalletIcon } from './WalletIcon';
import { getWalletGradient } from '../utils/gradients';
import { ConfirmModal } from './ConfirmModal';
import {
  formatVND,
  calculateWalletBalance,
  calculateTotalBalance,
  getMonthStats,
  getCurrentMonthString,
} from '../utils/storage';

interface CategoryManagerProps {
  wallets: Wallet[];
  onUpdateWallet: (updatedWallet: Wallet) => void;
  activeWalletId?: string;
  onClose?: () => void;
  summaryWalletIds?: string[];
  onUpdateSummaryWalletIds?: (updatedIds: string[]) => void;
  transactions?: Transaction[];
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  wallets,
  onUpdateWallet,
  activeWalletId,
  onClose,
  summaryWalletIds,
  onUpdateSummaryWalletIds,
  transactions,
}) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    activeWalletId || (wallets.length > 0 ? wallets[0]?.id : 'all')
  );

  useEffect(() => {
    if (activeWalletId) {
      setSelectedWalletId(activeWalletId);
    }
  }, [activeWalletId]);

  const isSummaryMode = selectedWalletId === 'all';
  const effectiveSummaryWalletIds = summaryWalletIds || wallets.map((w) => w.id);

  // Summary live preview metrics
  const summaryBalance = calculateTotalBalance(wallets, transactions || [], effectiveSummaryWalletIds);
  const currentMonth = getCurrentMonthString();
  const summaryStats = getMonthStats(currentMonth, 'all', transactions || [], effectiveSummaryWalletIds);

  const toggleWalletInSummary = (walletId: string) => {
    if (!onUpdateSummaryWalletIds) return;
    const isCurrentlyIncluded = effectiveSummaryWalletIds.includes(walletId);
    let next: string[];
    if (isCurrentlyIncluded) {
      next = effectiveSummaryWalletIds.filter((id) => id !== walletId);
    } else {
      next = [...effectiveSummaryWalletIds, walletId];
    }
    onUpdateSummaryWalletIds(next);
  };

  const handleSelectAllSummary = () => {
    if (!onUpdateSummaryWalletIds) return;
    onUpdateSummaryWalletIds(wallets.map((w) => w.id));
  };

  const handleDeselectAllSummary = () => {
    if (!onUpdateSummaryWalletIds) return;
    onUpdateSummaryWalletIds([]);
  };

  // Modals for adding income cat, group, category to group
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [incomeError, setIncomeError] = useState<string | null>(null);

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#f87171');

  const [activeGroupIdForCat, setActiveGroupIdForCat] = useState<string | null>(null);
  const [newCatInGroup, setNewCatInGroup] = useState('');
  const [catInGroupError, setCatInGroupError] = useState<string | null>(null);

  const [copySourceWalletId, setCopySourceWalletId] = useState<string>('');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Custom confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const activeWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];
  if (!activeWallet) return null;

  // Add Income Category
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    setIncomeError(null);
    const trimmed = newIncomeCat.trim();
    if (!trimmed) return;
    if (activeWallet.incomeCategories.includes(trimmed)) {
      setIncomeError('Danh mục này đã tồn tại trong ví!');
      return;
    }
    const updated = {
      ...activeWallet,
      incomeCategories: [...activeWallet.incomeCategories, trimmed],
    };
    onUpdateWallet(updated);
    setNewIncomeCat('');
    setIsAddIncomeOpen(false);
  };

  // Remove Income Category
  const handleRemoveIncome = (catName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xóa nguồn thu "${catName}"`,
      message: `Bạn có chắc chắn muốn xóa nguồn thu nhập "${catName}" khỏi ví "${activeWallet.name}"?`,
      confirmText: 'Xóa mục này',
      variant: 'danger',
      onConfirm: () => {
        const updated = {
          ...activeWallet,
          incomeCategories: activeWallet.incomeCategories.filter((c) => c !== catName),
        };
        onUpdateWallet(updated);
      },
    });
  };

  // Add Expense Group
  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: ExpenseGroup = {
      id: `cg-${Date.now()}`,
      name: newGroupName.trim(),
      color: newGroupColor,
      categories: [],
    };
    const updated = {
      ...activeWallet,
      expenseGroups: [...activeWallet.expenseGroups, newGroup],
    };
    onUpdateWallet(updated);
    setNewGroupName('');
    setIsAddGroupOpen(false);
  };

  // Remove Expense Group
  const handleRemoveGroup = (groupId: string) => {
    const group = activeWallet.expenseGroups.find((g) => g.id === groupId);
    const groupName = group ? group.name : 'này';
    setConfirmDialog({
      isOpen: true,
      title: `Xóa nhóm "${groupName}"`,
      message: `Tất cả danh mục trong nhóm "${groupName}" sẽ bị xóa. Bạn có chắc muốn xóa vĩnh viễn?`,
      confirmText: 'Xóa nhóm chi',
      variant: 'danger',
      onConfirm: () => {
        const updated = {
          ...activeWallet,
          expenseGroups: activeWallet.expenseGroups.filter((g) => g.id !== groupId),
        };
        onUpdateWallet(updated);
      },
    });
  };

  // Add Category to Group
  const handleAddCatToGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setCatInGroupError(null);
    const trimmed = newCatInGroup.trim();
    if (!trimmed || !activeGroupIdForCat) return;

    const group = activeWallet.expenseGroups.find((g) => g.id === activeGroupIdForCat);
    if (!group) return;

    if (group.categories.includes(trimmed)) {
      setCatInGroupError('Danh mục này đã có trong nhóm!');
      return;
    }

    const updatedGroups = activeWallet.expenseGroups.map((g) => {
      if (g.id === activeGroupIdForCat) {
        return {
          ...g,
          categories: [...g.categories, trimmed],
        };
      }
      return g;
    });

    onUpdateWallet({
      ...activeWallet,
      expenseGroups: updatedGroups,
    });

    setNewCatInGroup('');
    setActiveGroupIdForCat(null);
  };

  // Remove Category from Group
  const handleRemoveCatFromGroup = (groupId: string, catName: string) => {
    const updatedGroups = activeWallet.expenseGroups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          categories: g.categories.filter((c) => c !== catName),
        };
      }
      return g;
    });

    onUpdateWallet({
      ...activeWallet,
      expenseGroups: updatedGroups,
    });
  };

  // Copy categories from another wallet
  const handleCopyCategories = () => {
    const source = wallets.find((w) => w.id === copySourceWalletId);
    if (!source) return;

    const updated = {
      ...activeWallet,
      incomeCategories: [...source.incomeCategories],
      expenseGroups: source.expenseGroups.map((g) => ({
        ...g,
        id: `cg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        categories: [...g.categories],
      })),
    };

    onUpdateWallet(updated);
    setIsCopyModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Wallet Selector Tabs */}
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Chọn ví để tùy chỉnh danh mục & chọn ví tính tổng hợp
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {/* TAB VÍ TỔNG HỢP: Tùy chỉnh chọn ví để tính tổng hợp */}
          <button
            type="button"
            onClick={() => setSelectedWalletId('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              isSummaryMode
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-indigo-50/70 border-indigo-200/70 text-indigo-700 hover:bg-indigo-100/70'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                isSummaryMode ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </span>
            <span>Ví Tổng Hợp</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isSummaryMode
                  ? 'bg-white/25 text-white'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {effectiveSummaryWalletIds.length}/{wallets.length} ví
            </span>
          </button>

          {/* CÁC VÍ CỤ THỂ */}
          {wallets.map((w) => {
            const isSelected = selectedWalletId === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWalletId(w.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:text-slate-800'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-white shadow-2xs"
                  style={{ background: getWalletGradient(w) }}
                >
                  <WalletIcon icon={w.icon} className="w-3 h-3" />
                </span>
                <span>{w.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHẾ ĐỘ 1: TÙY CHỈNH VÍ TỔNG HỢP (TÍCH CHỌN HOẶC LOẠI TRỪ CÁC VÍ) */}
      {isSummaryMode ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Tùy Chỉnh Ví Tổng Hợp</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700">
                    {effectiveSummaryWalletIds.length}/{wallets.length} ví được chọn
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tích chọn ví nào thì tổng hợp sẽ tính cho ví đó. Bỏ tích ví nào thì loại ví đó ra khỏi số dư & báo cáo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={handleSelectAllSummary}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 rounded-xl text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1"
                title="Tích chọn tất cả các ví"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Chọn tất cả</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAllSummary}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold transition-all shadow-2xs"
                title="Bỏ tích toàn bộ ví"
              >
                <span>Bỏ chọn hết</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-semibold transition-colors"
                  title="Đóng tùy chỉnh"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Đóng</span>
                </button>
              )}
            </div>
          </div>

          {/* Real-time Summary Preview Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Số dư Ví Tổng Hợp xem trước
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white/10 text-emerald-300">
                {effectiveSummaryWalletIds.length === 0
                  ? 'Chưa chọn ví nào (0đ)'
                  : `Đang tính ${effectiveSummaryWalletIds.length}/${wallets.length} ví`}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-white">
                {formatVND(summaryBalance)}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-[11px]">
              <div>
                <p className="text-white/60 text-[10px] uppercase font-bold">Thu tháng này</p>
                <p className="font-bold text-emerald-400 tabular-nums">+{formatVND(summaryStats.income)}</p>
              </div>
              <div>
                <p className="text-white/60 text-[10px] uppercase font-bold">Chi tháng này</p>
                <p className="font-bold text-red-400 tabular-nums">-{formatVND(summaryStats.expense)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-[10px] uppercase font-bold">Dòng tiền</p>
                <p className={`font-bold tabular-nums ${summaryStats.net >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {summaryStats.net >= 0 ? '+' : ''}{formatVND(summaryStats.net)}
                </p>
              </div>
            </div>
          </div>

          {/* Checklist of Wallets */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Danh sách ví (Tích chọn để tính vào tổng hợp)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Chạm vào ví để bật/tắt
              </span>
            </div>

            <div className="space-y-2">
              {wallets.map((w) => {
                const isIncluded = effectiveSummaryWalletIds.includes(w.id);
                const wBalance = calculateWalletBalance(w.id, wallets, transactions || []);
                const txCount = (transactions || []).filter(
                  (t) => t.walletId === w.id || t.toWalletId === w.id
                ).length;

                return (
                  <div
                    key={w.id}
                    onClick={() => toggleWalletInSummary(w.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isIncluded
                        ? 'bg-indigo-50/40 border-indigo-200/80 shadow-2xs hover:bg-indigo-50/70'
                        : 'bg-slate-50/60 border-slate-200/60 opacity-60 hover:opacity-100 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox Icon */}
                      <div className="shrink-0">
                        {isIncluded ? (
                          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg border-2 border-slate-300 bg-white" />
                        )}
                      </div>

                      {/* Wallet Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ background: getWalletGradient(w) }}
                      >
                        <WalletIcon icon={w.icon} className="w-5 h-5" />
                      </div>

                      {/* Wallet Name & Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold truncate ${isIncluded ? 'text-slate-900' : 'text-slate-600'}`}>
                            {w.name}
                          </p>
                          {isIncluded ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                              ✓ Đang tính vào tổng hợp
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-600 shrink-0">
                              ✕ Loại trừ ra
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {txCount} giao dịch · {w.description || 'Ví chi tiêu'}
                        </p>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-xs font-bold tabular-nums ${isIncluded ? 'text-slate-900' : 'text-slate-500'}`}>
                        {formatVND(wBalance)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Số dư ví
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Informative Tip Box */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[11px] text-blue-950">Quy tắc tính toán Ví Tổng Hợp:</p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                • Khi xem <strong>Ví Tổng Hợp</strong> (Tổng tài sản trên Trang chủ & biểu đồ Phân tích), hệ thống chỉ tính tổng số dư và các giao dịch của những ví có dấu tích xanh <strong>✓ Đang tính vào tổng hợp</strong>.
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                • Những ví không tích chọn vẫn được lưu trữ, ghi chép và xem số dư độc lập bình thường mà không ảnh hưởng tới số liệu tổng hợp.
              </p>
            </div>
          </div>
        </div>
      ) : activeWallet ? (
        <>
          {/* Wallet Category Banner */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs"
                style={{ background: getWalletGradient(activeWallet) }}
              >
                <WalletIcon icon={activeWallet.icon} className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{activeWallet.name}</h4>
                <p className="text-[11px] text-slate-500">
                  {activeWallet.expenseGroups.length} nhóm chi tiêu · {activeWallet.incomeCategories.length} nguồn thu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {wallets.length > 1 && (
                <button
                  onClick={() => {
                    const other = wallets.find((w) => w.id !== activeWallet.id);
                    setCopySourceWalletId(other ? other.id : '');
                    setIsCopyModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép mẫu</span>
                </button>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-semibold transition-colors"
                  title="Đóng tùy chỉnh danh mục"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Đóng</span>
                </button>
              )}
            </div>
          </div>

      {/* SECTION 1: Income Categories */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Danh mục Thu nhập ({activeWallet.name})
          </span>
          <button
            onClick={() => setIsAddIncomeOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>

        {isAddIncomeOpen && (
          <div className="space-y-1.5 pt-1 animate-in fade-in">
            <form onSubmit={handleAddIncome} className="flex gap-2">
              <input
                type="text"
                value={newIncomeCat}
                onChange={(e) => {
                  setNewIncomeCat(e.target.value);
                  if (incomeError) setIncomeError(null);
                }}
                placeholder="VD: Lương, Thưởng, Bán hàng..."
                autoFocus
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddIncomeOpen(false);
                  setIncomeError(null);
                }}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
            </form>
            {incomeError && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 font-semibold pl-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {incomeError}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {activeWallet.incomeCategories.map((cat) => (
            <div
              key={cat}
              className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleRemoveIncome(cat)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-emerald-400 hover:text-emerald-700 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
          {activeWallet.incomeCategories.length === 0 && (
            <p className="text-xs text-slate-400 italic">Chưa có danh mục thu nhập nào.</p>
          )}
        </div>
      </div>

      {/* SECTION 2: Expense Groups and Categories */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
            Nhóm & Danh mục Chi tiêu ({activeWallet.name})
          </span>
          <button
            onClick={() => setIsAddGroupOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Nhóm mới</span>
          </button>
        </div>

        {/* Form add group */}
        {isAddGroupOpen && (
          <form onSubmit={handleAddGroup} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Tên nhóm mới (VD: Ăn uống, Hóa đơn, Giải trí...)"
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1.5">
                {['#f87171', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#f472b6', '#94a3b8'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewGroupColor(c)}
                    className="w-5 h-5 rounded-full"
                    style={{
                      backgroundColor: c,
                      outline: newGroupColor === c ? '2px solid #0f172a' : 'none',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGroupOpen(false)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                >
                  Tạo nhóm
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Groups List */}
        <div className="space-y-3">
          {activeWallet.expenseGroups.map((group) => (
            <div
              key={group.id}
              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {group.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({group.categories.length} mục)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Xóa nhóm này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Category tags */}
              <div className="flex flex-wrap gap-1.5">
                {group.categories.map((c) => (
                  <div
                    key={c}
                    className="bg-white px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 border border-slate-200/70 flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCatFromGroup(group.id, c)}
                      className="text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add category to this group */}
              {activeGroupIdForCat === group.id ? (
                <div className="space-y-1.5 pt-1">
                  <form onSubmit={handleAddCatToGroup} className="flex gap-1.5">
                    <input
                      type="text"
                      value={newCatInGroup}
                      onChange={(e) => {
                        setNewCatInGroup(e.target.value);
                        if (catInGroupError) setCatInGroupError(null);
                      }}
                      placeholder={`Thêm mục vào ${group.name}...`}
                      autoFocus
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveGroupIdForCat(null);
                        setCatInGroupError(null);
                      }}
                      className="px-2 py-1 text-xs text-slate-500 font-semibold"
                    >
                      Hủy
                    </button>
                  </form>
                  {catInGroupError && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1 font-semibold pl-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {catInGroupError}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveGroupIdForCat(group.id);
                    setNewCatInGroup('');
                    setCatInGroupError(null);
                  }}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 rounded-lg border border-dashed border-slate-200 text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm danh mục vào nhóm này</span>
                </button>
              )}
            </div>
          ))}

          {activeWallet.expenseGroups.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              Ví này chưa có nhóm chi tiêu nào. Hãy nhấn "+ Nhóm mới" để bắt đầu.
            </div>
          )}
        </div>
      </div>

      {/* Copy categories modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">
              Sao chép danh mục vào "{activeWallet.name}"
            </h4>
            <p className="text-xs text-slate-500">
              Chọn một ví khác làm mẫu để sao chép toàn bộ danh mục sang ví này:
            </p>

            <select
              value={copySourceWalletId}
              onChange={(e) => setCopySourceWalletId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800"
            >
              {wallets
                .filter((w) => w.id !== activeWallet.id)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.expenseGroups.length} nhóm, {w.incomeCategories.length} thu)
                  </option>
                ))}
            </select>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCopyCategories}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Sao chép ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) : null}

  {/* Confirm Action Dialog */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
