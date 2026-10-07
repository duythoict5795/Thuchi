import { AppState, Wallet, Transaction } from '../types/finance';

export const STORAGE_KEY = 'quanlythuchi_v1_clean';

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (isNaN(num)) return '0';
  return Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseFormattedNumber(str: string): number {
  const clean = str.replace(/[^\d]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function calculateWalletBalance(walletId: string, wallets: Wallet[], transactions: Transaction[]): number {
  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) return 0;

  let balance = wallet.initialBalance;

  for (const t of transactions) {
    if (t.type === 'income' && t.walletId === walletId) {
      balance += t.amount;
    } else if (t.type === 'expense' && t.walletId === walletId) {
      balance -= t.amount;
    } else if (t.type === 'transfer') {
      if (t.walletId === walletId) {
        // Chuyển tiền ra khỏi ví này
        balance -= t.amount;
      }
      if (t.toWalletId === walletId) {
        // Nhận tiền chuyển vào ví này
        balance += t.amount;
      }
    }
  }

  return balance;
}

export function calculateTotalBalance(wallets: Wallet[], transactions: Transaction[]): number {
  return wallets.reduce((total, wallet) => {
    return total + calculateWalletBalance(wallet.id, wallets, transactions);
  }, 0);
}

export function getMonthStats(monthStr: string, walletId: string, transactions: Transaction[]) {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (!t.date.startsWith(monthStr)) continue;

    if (walletId === 'all') {
      // Ví Tổng Hợp: chuyển khoản nội bộ không đổi tổng tài sản
      if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        expense += t.amount;
      }
    } else {
      // Ví cụ thể:
      if (t.type === 'income' && t.walletId === walletId) {
        income += t.amount;
      } else if (t.type === 'expense' && t.walletId === walletId) {
        expense += t.amount;
      } else if (t.type === 'transfer') {
        if (t.toWalletId === walletId) {
          income += t.amount;
        } else if (t.walletId === walletId) {
          expense += t.amount;
        }
      }
    }
  }

  return { income, expense, net: income - expense };
}

export const DEFAULT_STATE: AppState = {
  activeWalletId: 'all',
  wallets: [
    {
      id: 'w-cash',
      name: 'Tiền mặt',
      icon: 'wallet',
      color: '#10b981',
      initialBalance: 0,
      description: 'Tiền mặt chi tiêu thường ngày',
      incomeCategories: ['Lương', 'Thưởng', 'Thu nhập phụ'],
      expenseGroups: [
        {
          id: 'cg-cash-food',
          name: 'Ăn uống',
          color: '#f87171',
          categories: ['Ăn sáng', 'Ăn trưa', 'Ăn tối', 'Cà phê', 'Ăn vặt'],
        },
        {
          id: 'cg-cash-commute',
          name: 'Đi lại',
          color: '#fbbf24',
          categories: ['Đổ xăng', 'Gửi xe', 'Bảo dưỡng xe'],
        },
        {
          id: 'cg-cash-shopping',
          name: 'Sinh hoạt & Mua sắm',
          color: '#60a5fa',
          categories: ['Đi chợ', 'Tạp hóa', 'Thuốc men'],
        },
      ],
    },
    {
      id: 'w-bank',
      name: 'Tài khoản Ngân hàng',
      icon: 'landmark',
      color: '#4f46e5',
      initialBalance: 0,
      description: 'Tài khoản ngân hàng chính',
      incomeCategories: ['Lương chuyển khoản', 'Kinh doanh', 'Lãi đầu tư'],
      expenseGroups: [
        {
          id: 'cg-bank-bills',
          name: 'Hóa đơn định kỳ',
          color: '#6366f1',
          categories: ['Tiền thuê nhà', 'Tiền điện', 'Tiền nước', 'Internet', 'Phí dịch vụ'],
        },
        {
          id: 'cg-bank-shopping',
          name: 'Mua sắm & Gia đình',
          color: '#ec4899',
          categories: ['Siêu thị', 'Đồ gia dụng', 'Quần áo', 'Học phí'],
        },
      ],
    },
    {
      id: 'w-momo',
      name: 'Ví điện tử',
      icon: 'smartphone',
      color: '#db2777',
      initialBalance: 0,
      description: 'Ví điện tử thanh toán online',
      incomeCategories: ['Nhận tiền chuyển khoản', 'Hoàn tiền khuyến mãi'],
      expenseGroups: [
        {
          id: 'cg-momo-online',
          name: 'Dịch vụ trực tuyến',
          color: '#f97316',
          categories: ['Đặt đồ ăn online', 'Mua sắm sàn TMĐT', 'Nạp thẻ điện thoại', 'Xem phim / Giải trí'],
        },
      ],
    },
  ],
  transactions: [],
};

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed.wallets || !Array.isArray(parsed.wallets) || parsed.wallets.length === 0) {
      return DEFAULT_STATE;
    }
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving finance state:', err);
  }
}
