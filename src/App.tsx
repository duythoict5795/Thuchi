import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet as WalletIconLucide,
  Landmark,
  Smartphone,
  CreditCard,
  PiggyBank,
  Plus,
  ArrowRightLeft,
  Search,
  Calendar,
  DollarSign,
  PieChart,
  TrendingUp,
  Settings,
  Home,
  History,
  Download,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

import { AppState, Wallet, Transaction, ExpenseGroup } from './types/finance';
import {
  loadAppState,
  saveAppState,
  formatVND,
  formatNumber,
  parseFormattedNumber,
  getTodayDateString,
  getCurrentMonthString,
  calculateWalletBalance,
  calculateTotalBalance,
  getMonthStats,
  DEFAULT_STATE,
} from './utils/storage';
import { WalletIcon } from './components/WalletIcon';
import { DonutChart, DonutSlice } from './components/DonutChart';
import { TrendChart } from './components/TrendChart';
import { WalletModal } from './components/WalletModal';
import { TransactionModal } from './components/TransactionModal';
import { TransferModal } from './components/TransferModal';
import { CategoryManager } from './components/CategoryManager';

export default function App() {
  const [state, setState] = useState<AppState>(loadAppState);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'home' | 'analysis' | 'history' | 'settings'>('home');

  // Currently selected wallet in UI: 'all' (Ví Tổng Hợp) or wallet.id
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');

  // Modals state
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Home Quick Form state
  const [quickType, setQuickType] = useState<Transaction['type']>('expense');
  const [quickWalletId, setQuickWalletId] = useState<string>('');
  const [quickToWalletId, setQuickToWalletId] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<string>('');
  const [quickAmountDisplay, setQuickAmountDisplay] = useState<string>('');
  const [quickDate, setQuickDate] = useState<string>(getTodayDateString());
  const [quickNote, setQuickNote] = useState<string>('');

  // History Tab filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [historyWalletFilter, setHistoryWalletFilter] = useState('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({});

  // Analysis Tab state
  const [analysisWalletFilter, setAnalysisWalletFilter] = useState('all');
  const [analysisMode, setAnalysisMode] = useState<'month' | 'year'>('month');
  const [analysisMonth, setAnalysisMonth] = useState(getCurrentMonthString());
  const [analysisYear, setAnalysisYear] = useState(new Date().getFullYear().toString());
  const [selectedGroupModal, setSelectedGroupModal] = useState<{
    groupName: string;
    transactions: Transaction[];
  } | null>(null);

  // Floating Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  // Keep quick form wallet ID valid
  useEffect(() => {
    if (selectedWalletId !== 'all') {
      setQuickWalletId(selectedWalletId);
    } else if (!quickWalletId && state.wallets.length > 0) {
      setQuickWalletId(state.wallets[0].id);
    }
  }, [selectedWalletId, state.wallets]);

  // When quickWalletId changes, ensure quickCategory matches that wallet's categories
  const currentQuickWallet = useMemo(() => {
    return state.wallets.find((w) => w.id === quickWalletId) || state.wallets[0];
  }, [quickWalletId, state.wallets]);

  useEffect(() => {
    if (!currentQuickWallet) return;
    if (quickType === 'income') {
      if (
        !quickCategory ||
        !currentQuickWallet.incomeCategories.includes(quickCategory)
      ) {
        setQuickCategory(currentQuickWallet.incomeCategories[0] || 'Thu nhập');
      }
    } else if (quickType === 'expense') {
      const allCats = currentQuickWallet.expenseGroups.flatMap((g) => g.categories);
      if (!quickCategory || !allCats.includes(quickCategory)) {
        setQuickCategory(allCats[0] || 'Chi tiêu');
      }
    }
  }, [quickType, currentQuickWallet]);

  // Calculate current balances
  const totalBalance = useMemo(() => {
    return calculateTotalBalance(state.wallets, state.transactions);
  }, [state.wallets, state.transactions]);

  const activeWallet = useMemo(() => {
    if (selectedWalletId === 'all') return null;
    return state.wallets.find((w) => w.id === selectedWalletId) || null;
  }, [selectedWalletId, state.wallets]);

  const activeBalance = useMemo(() => {
    if (selectedWalletId === 'all') return totalBalance;
    return calculateWalletBalance(selectedWalletId, state.wallets, state.transactions);
  }, [selectedWalletId, totalBalance, state.wallets, state.transactions]);

  // Current Month Stats
  const currentMonth = getCurrentMonthString();
  const currentStats = useMemo(() => {
    return getMonthStats(currentMonth, selectedWalletId, state.transactions);
  }, [currentMonth, selectedWalletId, state.transactions]);

  // ----------------------------------------------------
  // Handlers for Wallets
  // ----------------------------------------------------
  const handleSaveWallet = (walletData: Partial<Wallet>, isEdit: boolean) => {
    if (isEdit) {
      setState((prev) => ({
        ...prev,
        wallets: prev.wallets.map((w) => (w.id === walletData.id ? ({ ...w, ...walletData } as Wallet) : w)),
      }));
      showToast('Đã cập nhật thông tin ví!');
    } else {
      const newWallet = walletData as Wallet;
      setState((prev) => ({
        ...prev,
        wallets: [...prev.wallets, newWallet],
      }));
      setSelectedWalletId(newWallet.id);
      showToast(`Đã tạo ví mới "${newWallet.name}"!`);
    }
  };

  const handleDeleteWallet = (walletId: string) => {
    const wallet = state.wallets.find((w) => w.id === walletId);
    if (!wallet) return;

    if (state.wallets.length <= 1) {
      alert('Hệ thống cần ít nhất một ví để hoạt động!');
      return;
    }

    const txCount = state.transactions.filter(
      (t) => t.walletId === walletId || t.toWalletId === walletId
    ).length;

    const confirmMsg =
      txCount > 0
        ? `Ví "${wallet.name}" đang có ${txCount} giao dịch liên quan. Xóa ví sẽ xóa luôn các giao dịch này. Bạn có chắc chắn muốn xóa?`
        : `Bạn có chắc muốn xóa ví "${wallet.name}"?`;

    if (!confirm(confirmMsg)) return;

    setState((prev) => ({
      ...prev,
      wallets: prev.wallets.filter((w) => w.id !== walletId),
      transactions: prev.transactions.filter(
        (t) => t.walletId !== walletId && t.toWalletId !== walletId
      ),
    }));

    if (selectedWalletId === walletId) {
      setSelectedWalletId('all');
    }
    showToast(`Đã xóa ví "${wallet.name}"!`);
  };

  // ----------------------------------------------------
  // Handlers for Transactions
  // ----------------------------------------------------
  const handleAddQuickTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFormattedNumber(quickAmountDisplay);
    if (amount <= 0) {
      alert('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    if (quickType === 'transfer') {
      const fromId = quickWalletId;
      const toId = quickToWalletId || state.wallets.find((w) => w.id !== fromId)?.id;
      if (!toId || fromId === toId) {
        alert('Vui lòng chọn ví nguồn và ví đích khác nhau');
        return;
      }

      const fromW = state.wallets.find((w) => w.id === fromId);
      const toW = state.wallets.find((w) => w.id === toId);

      const newTx: Transaction = {
        id: `t-${Date.now()}`,
        type: 'transfer',
        amount,
        walletId: fromId,
        toWalletId: toId,
        category: 'Chuyển tiền nội bộ',
        note: quickNote.trim() || `Chuyển từ ${fromW?.name} sang ${toW?.name}`,
        date: quickDate,
        createdAt: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
      showToast(`Đã chuyển ${formatVND(amount)} từ ${fromW?.name} sang ${toW?.name}!`);
    } else {
      const newTx: Transaction = {
        id: `t-${Date.now()}`,
        type: quickType,
        amount,
        walletId: quickWalletId,
        category: quickCategory,
        note: quickNote.trim(),
        date: quickDate,
        createdAt: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
      showToast(
        `Đã lưu giao dịch ${quickType === 'income' ? 'thu nhập' : 'chi tiêu'} ${formatVND(amount)}!`
      );
    }

    setQuickAmountDisplay('');
    setQuickNote('');
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t)),
    }));
    showToast('Đã lưu thay đổi giao dịch!');
  };

  const handleDeleteTransaction = (txId: string) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này vĩnh viễn?')) return;
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== txId),
    }));
    showToast('Đã xóa giao dịch thành công!');
  };

  const handleExecuteTransfer = (transferData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...transferData,
      id: `t-${Date.now()}`,
      createdAt: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
    showToast(`Chuyển ${formatVND(transferData.amount)} giữa 2 ví thành công!`);
  };

  // ----------------------------------------------------
  // Data Backup / Restore
  // ----------------------------------------------------
  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quan_ly_thu_chi_backup_${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file sao lưu dữ liệu!');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.wallets && Array.isArray(parsed.wallets)) {
          setState(parsed);
          showToast('Khôi phục dữ liệu từ file thành công!');
        } else {
          alert('Tệp dữ liệu không hợp lệ!');
        }
      } catch (err) {
        alert('Lỗi đọc tệp JSON!');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Bạn có chắc muốn đặt lại toàn bộ dữ liệu về mặc định ban đầu?')) {
      setState(DEFAULT_STATE);
      setSelectedWalletId('all');
      showToast('Đã khôi phục dữ liệu mẫu ban đầu!');
    }
  };

  // Toggle tree collapse
  const toggleCollapse = (key: string) => {
    setCollapsedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ----------------------------------------------------
  // Analysis Computations
  // ----------------------------------------------------
  // 1. Spending comparison across wallets (YÊU CẦU: Biểu đồ tròn so sánh tỷ trọng chi tiêu giữa các ví)
  const walletSpendingSlices = useMemo(() => {
    const isMonth = analysisMode === 'month';
    const targetPrefix = isMonth ? analysisMonth : analysisYear;

    // Filter all expense transactions in the period
    const expenses = state.transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(targetPrefix)
    );

    const totalsByWallet: Record<string, number> = {};
    state.wallets.forEach((w) => {
      totalsByWallet[w.id] = 0;
    });

    expenses.forEach((t) => {
      if (totalsByWallet[t.walletId] !== undefined) {
        totalsByWallet[t.walletId] += t.amount;
      }
    });

    const slices: DonutSlice[] = state.wallets
      .map((w) => ({
        id: w.id,
        label: w.name,
        value: totalsByWallet[w.id] || 0,
        color: w.color,
        sublabel: `${formatVND(totalsByWallet[w.id] || 0)} chi tiêu`,
      }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);

    return slices;
  }, [state.transactions, state.wallets, analysisMode, analysisMonth, analysisYear]);

  // 2. Spending breakdown by Category Group (for selected wallet or all wallets)
  const categoryGroupSlices = useMemo(() => {
    const isMonth = analysisMode === 'month';
    const targetPrefix = isMonth ? analysisMonth : analysisYear;

    const filteredExpenses = state.transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      if (!t.date.startsWith(targetPrefix)) return false;
      if (analysisWalletFilter !== 'all' && t.walletId !== analysisWalletFilter) return false;
      return true;
    });

    // Map each category to a group
    const groupTotals: Record<
      string,
      { id: string; name: string; color: string; total: number; transactions: Transaction[] }
    > = {};

    // Collect all groups from relevant wallets
    const relevantWallets =
      analysisWalletFilter === 'all'
        ? state.wallets
        : state.wallets.filter((w) => w.id === analysisWalletFilter);

    relevantWallets.forEach((w) => {
      w.expenseGroups.forEach((g) => {
        if (!groupTotals[g.name]) {
          groupTotals[g.name] = {
            id: g.id,
            name: g.name,
            color: g.color,
            total: 0,
            transactions: [],
          };
        }
      });
    });

    // Add fallback group
    const fallbackGroupName = 'Khác & Chưa phân loại';
    groupTotals[fallbackGroupName] = {
      id: 'fallback',
      name: fallbackGroupName,
      color: '#94a3b8',
      total: 0,
      transactions: [],
    };

    filteredExpenses.forEach((t) => {
      // Find matching group
      let matchedGroup = false;
      for (const w of relevantWallets) {
        for (const g of w.expenseGroups) {
          if (g.categories.includes(t.category)) {
            if (groupTotals[g.name]) {
              groupTotals[g.name].total += t.amount;
              groupTotals[g.name].transactions.push(t);
              matchedGroup = true;
              break;
            }
          }
        }
        if (matchedGroup) break;
      }

      if (!matchedGroup) {
        groupTotals[fallbackGroupName].total += t.amount;
        groupTotals[fallbackGroupName].transactions.push(t);
      }
    });

    return Object.values(groupTotals)
      .filter((g) => g.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((g) => ({
        id: g.id,
        label: g.name,
        value: g.total,
        color: g.color,
        sublabel: `${g.transactions.length} giao dịch`,
      }));
  }, [state.transactions, state.wallets, analysisMode, analysisMonth, analysisYear, analysisWalletFilter]);

  // 3. Trend Data (Day or Month)
  const trendChartData = useMemo(() => {
    if (analysisMode === 'month') {
      const [y, m] = analysisMonth.split('-');
      const daysCount = new Date(parseInt(y), parseInt(m), 0).getDate();
      const labels = Array.from({ length: daysCount }, (_, i) => `${i + 1}`);
      const incomeData = new Array(daysCount).fill(0);
      const expenseData = new Array(daysCount).fill(0);

      state.transactions.forEach((t) => {
        if (!t.date.startsWith(analysisMonth)) return;
        if (analysisWalletFilter !== 'all' && t.walletId !== analysisWalletFilter) return;

        const day = parseInt(t.date.split('-')[2]);
        if (day >= 1 && day <= daysCount) {
          if (t.type === 'income') incomeData[day - 1] += t.amount;
          else if (t.type === 'expense') expenseData[day - 1] += t.amount;
        }
      });

      return { labels, incomeData, expenseData };
    } else {
      // Year mode: 12 months
      const labels = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
      const incomeData = new Array(12).fill(0);
      const expenseData = new Array(12).fill(0);

      state.transactions.forEach((t) => {
        if (!t.date.startsWith(analysisYear)) return;
        if (analysisWalletFilter !== 'all' && t.walletId !== analysisWalletFilter) return;

        const monthIdx = parseInt(t.date.split('-')[1]) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          if (t.type === 'income') incomeData[monthIdx] += t.amount;
          else if (t.type === 'expense') expenseData[monthIdx] += t.amount;
        }
      });

      return { labels, incomeData, expenseData };
    }
  }, [state.transactions, analysisMode, analysisMonth, analysisYear, analysisWalletFilter]);

  // ----------------------------------------------------
  // History Tree Organization
  // ----------------------------------------------------
  const historyData = useMemo(() => {
    let filtered = state.transactions;

    if (historyWalletFilter !== 'all') {
      filtered = filtered.filter(
        (t) => t.walletId === historyWalletFilter || t.toWalletId === historyWalletFilter
      );
    }

    if (historyTypeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === historyTypeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((t) => {
        const wallet = state.wallets.find((w) => w.id === t.walletId);
        const toWallet = state.wallets.find((w) => w.id === t.toWalletId);
        return (
          t.note.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (wallet && wallet.name.toLowerCase().includes(q)) ||
          (toWallet && toWallet.name.toLowerCase().includes(q)) ||
          t.amount.toString().includes(q)
        );
      });
    }

    // Group by month -> day
    const monthsMap: Record<
      string,
      {
        monthStr: string;
        income: number;
        expense: number;
        days: Record<string, { date: string; income: number; expense: number; items: Transaction[] }>;
      }
    > = {};

    filtered.forEach((t) => {
      const mKey = t.date.substring(0, 7);
      if (!monthsMap[mKey]) {
        monthsMap[mKey] = { monthStr: mKey, income: 0, expense: 0, days: {} };
      }
      if (t.type === 'income') monthsMap[mKey].income += t.amount;
      else if (t.type === 'expense') monthsMap[mKey].expense += t.amount;

      if (!monthsMap[mKey].days[t.date]) {
        monthsMap[mKey].days[t.date] = { date: t.date, income: 0, expense: 0, items: [] };
      }
      if (t.type === 'income') monthsMap[mKey].days[t.date].income += t.amount;
      else if (t.type === 'expense') monthsMap[mKey].days[t.date].expense += t.amount;
      monthsMap[mKey].days[t.date].items.push(t);
    });

    const sortedMonths = Object.keys(monthsMap)
      .sort((a, b) => b.localeCompare(a))
      .map((mKey) => {
        const mObj = monthsMap[mKey];
        const sortedDays = Object.keys(mObj.days)
          .sort((a, b) => b.localeCompare(a))
          .map((dKey) => {
            const dObj = mObj.days[dKey];
            dObj.items.sort((a, b) => b.createdAt - a.createdAt);
            return dObj;
          });
        return { ...mObj, dayList: sortedDays };
      });

    return sortedMonths;
  }, [state.transactions, state.wallets, historyWalletFilter, historyTypeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* ----------------- TOP APP BAR ----------------- */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                Quản Lý Thu Chi
              </h1>
              <span className="text-[10px] font-semibold text-indigo-600">
                Hệ Thống Đa Ví Thông Minh
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl tabular-nums">
              {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              title="Chuyển tiền nhanh giữa các ví"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold border border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ----------------- MAIN CONTENT CONTAINER ----------------- */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: TRANG CHỦ (DASHBOARD & NHANH)                     */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Quick Wallet Switcher Carousel */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Chọn ví xem số dư
                </span>
                <button
                  onClick={() => {
                    setWalletToEdit(null);
                    setIsWalletModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm ví mới</span>
                </button>
              </div>

              {/* Horizontal Scroll of Wallets */}
              <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                {/* All Wallets / Ví Tổng Hợp */}
                <button
                  onClick={() => setSelectedWalletId('all')}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all flex-shrink-0 border ${
                    selectedWalletId === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                      : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      selectedWalletId === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight">Ví Tổng Hợp</p>
                    <p
                      className={`text-[10px] font-medium tabular-nums ${
                        selectedWalletId === 'all' ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {formatVND(totalBalance)}
                    </p>
                  </div>
                </button>

                {/* Individual Wallets */}
                {state.wallets.map((wallet) => {
                  const isSelected = selectedWalletId === wallet.id;
                  const bal = calculateWalletBalance(wallet.id, state.wallets, state.transactions);

                  return (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWalletId(wallet.id)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all flex-shrink-0 border ${
                        isSelected
                          ? 'bg-white text-slate-900 border-slate-900 shadow-md ring-2 ring-slate-900/10'
                          : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-2xs"
                        style={{ backgroundColor: wallet.color }}
                      >
                        <WalletIcon icon={wallet.icon} className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold leading-tight">{wallet.name}</p>
                        <p className="text-[10px] font-medium text-slate-500 tabular-nums">
                          {formatVND(bal)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Balance Hero Card */}
            <div
              className={`rounded-3xl p-6 text-white shadow-xl transition-all duration-300 ${
                selectedWalletId === 'all'
                  ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800'
                  : 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-white/80 text-xs font-medium tracking-wide">
                    {selectedWalletId === 'all'
                      ? 'Tổng tài sản khả dụng (Tất cả ví)'
                      : `Số dư ví: ${activeWallet?.name}`}
                  </p>
                </div>

                {selectedWalletId !== 'all' && activeWallet && (
                  <button
                    onClick={() => {
                      setWalletToEdit(activeWallet);
                      setIsWalletModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-white/70 hover:text-white flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa ví</span>
                  </button>
                )}
              </div>

              {/* Huge Balance Figure */}
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 tabular-nums">
                {formatVND(activeBalance)}
              </h2>

              {/* Monthly Flow Sub-metrics */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-white/15">
                <div>
                  <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider">
                    Thu tháng này
                  </p>
                  <p className="font-bold text-sm sm:text-base text-emerald-300 tabular-nums mt-0.5">
                    +{formatVND(currentStats.income)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider">
                    Chi tháng này
                  </p>
                  <p className="font-bold text-sm sm:text-base text-red-300 tabular-nums mt-0.5">
                    -{formatVND(currentStats.expense)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider">
                    Dòng tiền ròng
                  </p>
                  <p
                    className={`font-bold text-sm sm:text-base tabular-nums mt-0.5 ${
                      currentStats.net >= 0 ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {currentStats.net >= 0 ? '+' : ''}
                    {formatVND(currentStats.net)}
                  </p>
                </div>
              </div>
            </div>

            {/* Chi tiết từng ví riêng biệt (YÊU CẦU: Hiển thị số dư chi tiết của từng ví riêng biệt) */}
            <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Chi tiết từng ví & Tài khoản
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Theo dõi số dư và tỷ lệ phân bổ tài sản
                  </p>
                </div>
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Chuyển tiền</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {state.wallets.map((wallet) => {
                  const bal = calculateWalletBalance(wallet.id, state.wallets, state.transactions);
                  const share =
                    totalBalance > 0 ? ((bal / totalBalance) * 100).toFixed(1) : '0';

                  return (
                    <div
                      key={wallet.id}
                      onClick={() => setSelectedWalletId(wallet.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        selectedWalletId === wallet.id
                          ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs"
                          style={{ backgroundColor: wallet.color }}
                        >
                          <WalletIcon icon={wallet.icon} className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">{wallet.name}</span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {share}%
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 tabular-nums mt-0.5">
                            {formatVND(bal)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickType('transfer');
                            setQuickWalletId(wallet.id);
                            setIsTransferModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                          title="Chuyển tiền từ ví này"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORM GIAO DỊCH MỚI */}
            <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Thêm Giao Dịch Mới
              </h3>

              <form onSubmit={handleAddQuickTransaction} className="space-y-4">
                {/* Type Switcher */}
                <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => setQuickType('expense')}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase transition-all ${
                      quickType === 'expense'
                        ? 'bg-white text-red-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickType('income')}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase transition-all ${
                      quickType === 'income'
                        ? 'bg-white text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Thu nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickType('transfer')}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase transition-all ${
                      quickType === 'transfer'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Chuyển tiền
                  </button>
                </div>

                {/* Wallets & Categories Selection */}
                {quickType === 'transfer' ? (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Từ ví (Nguồn)
                      </label>
                      <select
                        value={quickWalletId}
                        onChange={(e) => setQuickWalletId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
                      >
                        {state.wallets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Đến ví (Đích)
                      </label>
                      <select
                        value={
                          quickToWalletId ||
                          state.wallets.find((w) => w.id !== quickWalletId)?.id ||
                          ''
                        }
                        onChange={(e) => setQuickToWalletId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
                      >
                        {state.wallets
                          .filter((w) => w.id !== quickWalletId)
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Wallet Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Ví thực hiện
                      </label>
                      <div className="relative">
                        <select
                          value={quickWalletId}
                          onChange={(e) => setQuickWalletId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        >
                          {state.wallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({formatVND(calculateWalletBalance(w.id, state.wallets, state.transactions))})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Category Selector (Tự động tải danh mục theo ví đã chọn) */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Danh mục ({currentQuickWallet?.name})
                      </label>
                      <select
                        value={quickCategory}
                        onChange={(e) => setQuickCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        {quickType === 'income' ? (
                          currentQuickWallet?.incomeCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))
                        ) : (
                          currentQuickWallet?.expenseGroups.map((g) => (
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
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Số tiền (₫)
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Nhập số tiền</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={quickAmountDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setQuickAmountDisplay(raw ? formatNumber(parseInt(raw, 10)) : '');
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-2xl font-bold text-right text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  {/* Quick Amount Suggestion Chips */}
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 custom-scrollbar">
                    {[50000, 100000, 200000, 500000, 1000000, 2000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuickAmountDisplay(formatNumber(amt))}
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Ngày
                    </label>
                    <input
                      type="date"
                      value={quickDate}
                      onChange={(e) => setQuickDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      placeholder="Chi tiết giao dịch..."
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-98"
                >
                  Lưu Giao Dịch
                </button>
              </form>
            </div>

            {/* Gần đây trong tháng */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Gần đây tháng này ({selectedWalletId === 'all' ? 'Tất cả ví' : activeWallet?.name})
                </h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                >
                  Xem tất cả
                </button>
              </div>

              {/* Transactions filtered for home */}
              {(() => {
                const recentThisMonth = state.transactions
                  .filter((t) => {
                    if (!t.date.startsWith(currentMonth)) return false;
                    if (selectedWalletId === 'all') return true;
                    return t.walletId === selectedWalletId || t.toWalletId === selectedWalletId;
                  })
                  .slice(0, 8);

                if (recentThisMonth.length === 0) {
                  return (
                    <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 p-6 text-slate-400 text-xs italic">
                      Chưa có giao dịch nào trong tháng này. Hãy thêm giao dịch đầu tiên!
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {recentThisMonth.map((t) => {
                      const wallet = state.wallets.find((w) => w.id === t.walletId);
                      const toWallet = state.wallets.find((w) => w.id === t.toWalletId);

                      return (
                        <div
                          key={t.id}
                          className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between transition-colors hover:border-slate-200"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[9px] flex-shrink-0 ${
                                t.type === 'income'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : t.type === 'expense'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-indigo-50 text-indigo-600'
                              }`}
                            >
                              {t.type === 'income' ? 'THU' : t.type === 'expense' ? 'CHI' : 'CHUYỂN'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-xs truncate">
                                {t.type === 'transfer'
                                  ? `${wallet?.name} ➔ ${toWallet?.name}`
                                  : t.category}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                <span
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: wallet?.color || '#cbd5e1' }}
                                />
                                <span className="truncate">{wallet?.name}</span>
                                <span>·</span>
                                <span>{t.date.split('-').reverse().join('/')}</span>
                                {t.note && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate max-w-[100px]">{t.note}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                            <span
                              className={`text-xs font-bold tabular-nums ${
                                t.type === 'income'
                                  ? 'text-emerald-600'
                                  : t.type === 'expense'
                                  ? 'text-slate-800'
                                  : 'text-indigo-600'
                              }`}
                            >
                              {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                              {formatVND(t.amount)}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setTransactionToEdit(t);
                                  setIsTransactionModalOpen(true);
                                }}
                                className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-1 text-slate-300 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PHÂN TÍCH (CHARTS, SPENDING COMPARISON, TRENDS)  */}
        {/* ======================================================== */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Filter Card: Wallet & Time period */}
            <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Báo cáo & Phân tích</h3>
                  <p className="text-xs text-slate-500">So sánh chi tiêu đa ví và nhóm ngân sách</p>
                </div>

                {/* Mode Selector: Month vs Year */}
                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setAnalysisMode('month')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      analysisMode === 'month'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tháng
                  </button>
                  <button
                    onClick={() => setAnalysisMode('year')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      analysisMode === 'year'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Năm
                  </button>
                </div>
              </div>

              {/* Filter inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Xem theo ví
                  </label>
                  <select
                    value={analysisWalletFilter}
                    onChange={(e) => setAnalysisWalletFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="all">✨ Tất cả các ví (Toàn hệ thống)</option>
                    {state.wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Thời gian
                  </label>
                  {analysisMode === 'month' ? (
                    <input
                      type="month"
                      value={analysisMonth}
                      onChange={(e) => setAnalysisMonth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                    />
                  ) : (
                    <select
                      value={analysisYear}
                      onChange={(e) => setAnalysisYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                    >
                      {[2024, 2025, 2026, 2027].map((yr) => (
                        <option key={yr} value={yr}>
                          Năm {yr}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION: TỶ TRỌNG CHI TIÊU GIỮA CÁC VÍ (YÊU CẦU ĐẶC BIỆT) */}
            <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Tỷ Trọng Chi Tiêu Giữa Các Ví
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    So sánh cơ cấu tiền chi ra từ từng nguồn tài khoản
                  </p>
                </div>
              </div>

              <DonutChart
                slices={walletSpendingSlices}
                centerLabel="Tổng chi"
                onSliceClick={(slice) => {
                  setAnalysisWalletFilter(slice.id);
                }}
              />
            </div>

            {/* SECTION: CHI TIÊU THEO NHÓM DANH MỤC */}
            <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Phân Bổ Chi Tiêu Theo Nhóm
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {analysisWalletFilter === 'all'
                      ? 'Tổng hợp từ tất cả các ví'
                      : `Riêng cho ví ${state.wallets.find((w) => w.id === analysisWalletFilter)?.name}`}
                  </p>
                </div>
              </div>

              <DonutChart
                slices={categoryGroupSlices}
                centerLabel="Tổng chi"
                onSliceClick={(slice) => {
                  // Find all transactions in this group
                  const targetPrefix = analysisMode === 'month' ? analysisMonth : analysisYear;
                  const matchingTxs = state.transactions.filter((t) => {
                    if (t.type !== 'expense') return false;
                    if (!t.date.startsWith(targetPrefix)) return false;
                    if (analysisWalletFilter !== 'all' && t.walletId !== analysisWalletFilter)
                      return false;
                    return true;
                  });
                  setSelectedGroupModal({
                    groupName: slice.label,
                    transactions: matchingTxs,
                  });
                }}
              />
            </div>

            {/* SECTION: XU HƯỚNG DÒNG TIỀN (THU VS CHI) */}
            <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
              <TrendChart
                mode={analysisMode}
                labels={trendChartData.labels}
                incomeData={trendChartData.incomeData}
                expenseData={trendChartData.expenseData}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: LỊCH SỬ GIAO DỊCH (HISTORY & FILTERS)             */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 space-y-3">
              {/* Search input */}
              <div className="relative flex items-center bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo ghi chú, danh mục, số tiền, tên ví..."
                  className="w-full bg-transparent text-xs font-semibold focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Row: Wallet & Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <select
                    value={historyWalletFilter}
                    onChange={(e) => setHistoryWalletFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700"
                  >
                    <option value="all">✨ Tất cả các ví</option>
                    {state.wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={historyTypeFilter}
                    onChange={(e) => setHistoryTypeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700"
                  >
                    <option value="all">Tất cả loại giao dịch</option>
                    <option value="expense">Chỉ chi tiêu</option>
                    <option value="income">Chỉ thu nhập</option>
                    <option value="transfer">Chỉ chuyển tiền</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tree View of Transactions */}
            <div className="space-y-3">
              {historyData.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 text-slate-400 text-xs italic">
                  Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                </div>
              ) : (
                historyData.map((mObj) => {
                  const [y, m] = mObj.monthStr.split('-');
                  const isMonthCollapsed = collapsedKeys[mObj.monthStr];

                  return (
                    <div
                      key={mObj.monthStr}
                      className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden"
                    >
                      {/* Month Header */}
                      <button
                        onClick={() => toggleCollapse(mObj.monthStr)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100/60 transition-colors border-b border-slate-100 text-left"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Tháng {m}/{y}
                          </p>
                          <div className="flex gap-3 text-[10px] font-semibold mt-0.5">
                            <span className="text-emerald-600">+{formatVND(mObj.income)}</span>
                            <span className="text-red-500">-{formatVND(mObj.expense)}</span>
                          </div>
                        </div>
                        {isMonthCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {/* Days inside Month */}
                      {!isMonthCollapsed && (
                        <div className="divide-y divide-slate-100">
                          {mObj.dayList.map((dObj) => {
                            const isDayCollapsed = collapsedKeys[dObj.date];
                            const dateParts = dObj.date.split('-');
                            const dayDisplay = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

                            return (
                              <div key={dObj.date} className="p-3 space-y-2">
                                <button
                                  onClick={() => toggleCollapse(dObj.date)}
                                  className="w-full flex items-center justify-between text-left px-1"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-600">
                                      {dayDisplay}
                                    </span>
                                    <span className="text-[10px] text-red-500 font-medium">
                                      Chi: {formatVND(dObj.expense)}
                                    </span>
                                  </div>
                                  {isDayCollapsed ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                                  ) : (
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
                                  )}
                                </button>

                                {/* Transactions in this Day */}
                                {!isDayCollapsed && (
                                  <div className="space-y-1.5 pl-1">
                                    {dObj.items.map((t) => {
                                      const wallet = state.wallets.find((w) => w.id === t.walletId);
                                      const toWallet = state.wallets.find((w) => w.id === t.toWalletId);

                                      return (
                                        <div
                                          key={t.id}
                                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl hover:bg-slate-100/70 transition-colors"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div
                                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[8px] flex-shrink-0 ${
                                                t.type === 'income'
                                                  ? 'bg-emerald-100 text-emerald-700'
                                                  : t.type === 'expense'
                                                  ? 'bg-red-100 text-red-700'
                                                  : 'bg-indigo-100 text-indigo-700'
                                              }`}
                                            >
                                              {t.type === 'income'
                                                ? 'THU'
                                                : t.type === 'expense'
                                                ? 'CHI'
                                                : 'CHUYỂN'}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-xs font-bold text-slate-800 truncate">
                                                {t.type === 'transfer'
                                                  ? `${wallet?.name} ➔ ${toWallet?.name}`
                                                  : t.category}
                                              </p>
                                              <p className="text-[10px] text-slate-400 truncate">
                                                <span
                                                  className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                                                  style={{ backgroundColor: wallet?.color || '#94a3b8' }}
                                                />
                                                {wallet?.name}
                                                {t.note ? ` · ${t.note}` : ''}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <span
                                              className={`text-xs font-bold tabular-nums ${
                                                t.type === 'income'
                                                  ? 'text-emerald-600'
                                                  : t.type === 'expense'
                                                  ? 'text-slate-900'
                                                  : 'text-indigo-600'
                                              }`}
                                            >
                                              {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                                              {formatVND(t.amount)}
                                            </span>
                                            <div className="flex items-center">
                                              <button
                                                onClick={() => {
                                                  setTransactionToEdit(t);
                                                  setIsTransactionModalOpen(true);
                                                }}
                                                className="p-1 text-slate-300 hover:text-indigo-600"
                                              >
                                                <Edit3 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteTransaction(t.id)}
                                                className="p-1 text-slate-300 hover:text-red-600"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CÀI ĐẶT (WALLETS, PER-WALLET CATEGORIES, BACKUP)   */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* SECTION 1: Quản lý danh sách Ví */}
            <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Quản Lý Các Ví</h3>
                  <p className="text-xs text-slate-500">Tạo mới, sửa tên, đổi màu và quản lý số dư</p>
                </div>
                <button
                  onClick={() => {
                    setWalletToEdit(null);
                    setIsWalletModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm ví mới</span>
                </button>
              </div>

              {/* Wallets List */}
              <div className="space-y-3">
                {state.wallets.map((w) => {
                  const bal = calculateWalletBalance(w.id, state.wallets, state.transactions);
                  return (
                    <div
                      key={w.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs"
                          style={{ backgroundColor: w.color }}
                        >
                          <WalletIcon icon={w.icon} className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{w.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {w.expenseGroups.length} nhóm chi
                            </span>
                          </div>
                          <p className="text-xs font-bold text-indigo-700 tabular-nums mt-0.5">
                            Hiện có: {formatVND(bal)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Số dư ban đầu: {formatVND(w.initialBalance)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setWalletToEdit(w);
                            setIsWalletModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 text-xs font-bold rounded-xl transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteWallet(w.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          title="Xóa ví"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Tùy chỉnh danh mục độc lập theo từng ví */}
            <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">Tùy Chỉnh Danh Mục Theo Ví</h3>
                <p className="text-xs text-slate-500">
                  Mỗi ví có danh mục độc lập giúp quản lý ngân sách hiệu quả cho từng mục đích
                </p>
              </div>

              <CategoryManager
                wallets={state.wallets}
                onUpdateWallet={(updated) => {
                  setState((prev) => ({
                    ...prev,
                    wallets: prev.wallets.map((w) => (w.id === updated.id ? updated : w)),
                  }));
                }}
              />
            </div>

            {/* SECTION 3: Quản lý Dữ liệu (Sao lưu & Khôi phục) */}
            <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-800">Dữ Liệu & Sao Lưu</h3>
              <p className="text-xs text-slate-500">
                Toàn bộ dữ liệu được lưu an toàn trực tiếp trên trình duyệt của bạn
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportData}
                  className="flex flex-col items-center justify-center p-4 bg-blue-50/70 hover:bg-blue-100 text-blue-700 rounded-2xl gap-2 transition-colors border border-blue-100"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Sao lưu (Export)</span>
                </button>

                <label className="flex flex-col items-center justify-center p-4 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 rounded-2xl gap-2 transition-colors border border-emerald-100 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Khôi phục (Import)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResetData}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                >
                  Đặt lại dữ liệu mặc định
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ----------------- FIXED BOTTOM NAVIGATION ----------------- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 safe-area-bottom">
        <div className="max-w-2xl mx-auto grid grid-cols-4 items-center h-16">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Trang Chủ</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'analysis' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PieChart className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Phân Tích</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <History className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Lịch Sử</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Settings className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cài Đặt</span>
          </button>
        </div>
      </nav>

      {/* ----------------- MODALS ----------------- */}
      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSave={handleSaveWallet}
        walletToEdit={walletToEdit}
        existingWallets={state.wallets}
      />

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleUpdateTransaction}
        transaction={transactionToEdit}
        wallets={state.wallets}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={handleExecuteTransfer}
        wallets={state.wallets}
        transactions={state.transactions}
        defaultFromWalletId={selectedWalletId}
      />

      {/* Group Details Modal */}
      {selectedGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Nhóm: {selectedGroupModal.groupName}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedGroupModal.transactions.length} giao dịch chi tiết
                </p>
              </div>
              <button
                onClick={() => setSelectedGroupModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {selectedGroupModal.transactions.map((t) => {
                const wallet = state.wallets.find((w) => w.id === t.walletId);
                return (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {t.category} {t.note ? `· ${t.note}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {wallet?.name} · {t.date.split('-').reverse().join('/')}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-red-500 tabular-nums">
                      -{formatVND(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedGroupModal(null)}
              className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
