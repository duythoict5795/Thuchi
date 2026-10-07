import React, { useState } from 'react';
import { Plus, Trash2, FolderPlus, Copy, Check } from 'lucide-react';
import { Wallet, ExpenseGroup } from '../types/finance';
import { WalletIcon } from './WalletIcon';

interface CategoryManagerProps {
  wallets: Wallet[];
  onUpdateWallet: (updatedWallet: Wallet) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  wallets,
  onUpdateWallet,
}) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');
  
  // Modals for adding income cat, group, category to group
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [newIncomeCat, setNewIncomeCat] = useState('');

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#f87171');

  const [activeGroupIdForCat, setActiveGroupIdForCat] = useState<string | null>(null);
  const [newCatInGroup, setNewCatInGroup] = useState('');

  const [copySourceWalletId, setCopySourceWalletId] = useState<string>('');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  const activeWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];
  if (!activeWallet) return null;

  // Add Income Category
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncomeCat.trim()) return;
    if (activeWallet.incomeCategories.includes(newIncomeCat.trim())) {
      alert('Danh mục này đã tồn tại!');
      return;
    }
    const updated = {
      ...activeWallet,
      incomeCategories: [...activeWallet.incomeCategories, newIncomeCat.trim()],
    };
    onUpdateWallet(updated);
    setNewIncomeCat('');
    setIsAddIncomeOpen(false);
  };

  // Remove Income Category
  const handleRemoveIncome = (catName: string) => {
    const updated = {
      ...activeWallet,
      incomeCategories: activeWallet.incomeCategories.filter((c) => c !== catName),
    };
    onUpdateWallet(updated);
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
    if (!confirm('Bạn có chắc muốn xóa nhóm chi tiêu này?')) return;
    const updated = {
      ...activeWallet,
      expenseGroups: activeWallet.expenseGroups.filter((g) => g.id !== groupId),
    };
    onUpdateWallet(updated);
  };

  // Add Category to Group
  const handleAddCatToGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInGroup.trim() || !activeGroupIdForCat) return;

    const group = activeWallet.expenseGroups.find((g) => g.id === activeGroupIdForCat);
    if (!group) return;

    if (group.categories.includes(newCatInGroup.trim())) {
      alert('Danh mục này đã có trong nhóm!');
      return;
    }

    const updatedGroups = activeWallet.expenseGroups.map((g) => {
      if (g.id === activeGroupIdForCat) {
        return {
          ...g,
          categories: [...g.categories, newCatInGroup.trim()],
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
          Chọn ví để tùy chỉnh danh mục độc lập
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {wallets.map((w) => {
            const isSelected = w.id === activeWallet.id;
            return (
              <button
                key={w.id}
                onClick={() => setSelectedWalletId(w.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-white border-slate-300 shadow-sm text-slate-900'
                    : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:text-slate-800'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: w.color }}
                >
                  <WalletIcon icon={w.icon} className="w-3 h-3" />
                </span>
                <span>{w.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wallet Category Banner */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: activeWallet.color }}
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
          <form onSubmit={handleAddIncome} className="flex gap-2 pt-1 animate-in fade-in">
            <input
              type="text"
              value={newIncomeCat}
              onChange={(e) => setNewIncomeCat(e.target.value)}
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
              onClick={() => setIsAddIncomeOpen(false)}
              className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
            >
              Hủy
            </button>
          </form>
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
                <form onSubmit={handleAddCatToGroup} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newCatInGroup}
                    onChange={(e) => setNewCatInGroup(e.target.value)}
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
                    onClick={() => setActiveGroupIdForCat(null)}
                    className="px-2 py-1 text-xs text-slate-500 font-semibold"
                  >
                    Hủy
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveGroupIdForCat(group.id);
                    setNewCatInGroup('');
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
    </div>
  );
};
