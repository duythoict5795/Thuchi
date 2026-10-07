import { AppState, Wallet, Transaction } from '../types/finance';

export const STORAGE_KEY = 'finance_pro_multiwallet_v1';

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
      // Ví Tổng Hợp:
      // Chuyển khoản nội bộ giữa 2 ví không làm thay đổi tổng tài sản nên không tính vào thu/chi ngoài
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
          income += t.amount; // Nhận tiền từ ví khác coi như thu vào ví này
        } else if (t.walletId === walletId) {
          expense += t.amount; // Chuyển sang ví khác coi như chi ra khỏi ví này
        }
      }
    }
  }

  return { income, expense, net: income - expense };
}

const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, '0');
const currentMonth = `${y}-${m}`;

export const DEFAULT_STATE: AppState = {
  activeWalletId: 'all',
  wallets: [
    {
      id: 'w-cash',
      name: 'Tiền mặt',
      icon: 'wallet',
      color: '#10b981',
      initialBalance: 3200000,
      description: 'Tiền mặt trong ví, chi tiêu thường nhật',
      incomeCategories: ['Lương ứng trước', 'Thu hồi nợ', 'Tiền thưởng nóng', 'Tiền bán đồ cũ'],
      expenseGroups: [
        {
          id: 'cg-cash-food',
          name: 'Ăn uống hàng ngày',
          color: '#f87171',
          categories: ['Ăn sáng', 'Cà phê sáng', 'Ăn trưa', 'Ăn tối vỉa hè', 'Trà đá'],
        },
        {
          id: 'cg-cash-commute',
          name: 'Đi lại & Xe cộ',
          color: '#fbbf24',
          categories: ['Đổ xăng', 'Gửi xe', 'Rửa xe', 'Vá xe'],
        },
        {
          id: 'cg-cash-misc',
          name: 'Lặt vặt & Chợ búa',
          color: '#94a3b8',
          categories: ['Đi chợ truyền thống', 'Mua tạp hóa nhỏ', 'Thuốc men cấp tốc'],
        },
      ],
    },
    {
      id: 'w-bank',
      name: 'Tài khoản Ngân hàng',
      icon: 'landmark',
      color: '#4f46e5',
      initialBalance: 24500000,
      description: 'Tài khoản chính nhận lương và chi trả định kỳ',
      incomeCategories: ['Lương chuyển khoản', 'Thu nhập freelance', 'Thưởng quý', 'Cổ tức / Lãi đầu tư'],
      expenseGroups: [
        {
          id: 'cg-bank-bills',
          name: 'Hóa đơn sinh hoạt',
          color: '#6366f1',
          categories: ['Tiền thuê nhà', 'Tiền điện', 'Tiền nước', 'Internet cáp quang', 'Phí chung cư'],
        },
        {
          id: 'cg-bank-shopping',
          name: 'Mua sắm lớn',
          color: '#ec4899',
          categories: ['Siêu thị gia đình', 'Đồ công nghệ', 'Gia dụng & Nội thất', 'Quần áo'],
        },
        {
          id: 'cg-bank-health',
          name: 'Y tế & Giáo dục',
          color: '#14b8a6',
          categories: ['Khám sức khỏe', 'Bảo hiểm', 'Học phí / Khóa học'],
        },
      ],
    },
    {
      id: 'w-momo',
      name: 'Ví điện tử Momo',
      icon: 'smartphone',
      color: '#db2777',
      initialBalance: 1650000,
      description: 'Thanh toán trực tuyến, ăn uống giao tận nơi',
      incomeCategories: ['Bạn bè hoàn tiền', 'Quà tặng khuyến mãi', 'Tiền thưởng tích lũy'],
      expenseGroups: [
        {
          id: 'cg-momo-delivery',
          name: 'Đặt món & Giao hàng',
          color: '#f97316',
          categories: ['ShopeeFood', 'GrabFood', 'Be Delivery', 'Trà sữa online'],
        },
        {
          id: 'cg-momo-digital',
          name: 'Giải trí & Số hóa',
          color: '#8b5cf6',
          categories: ['Nạp 4G điện thoại', 'Netflix / Spotify', 'Xem phim rạp CGV', 'Mua sắm Shopee/Lazada'],
        },
      ],
    },
    {
      id: 'w-saving',
      name: 'Quỹ Tiết Kiệm',
      icon: 'piggy-bank',
      color: '#eab308',
      initialBalance: 60000000,
      description: 'Quỹ dự phòng tài chính và mục tiêu tương lai',
      incomeCategories: ['Trích lương tự động', 'Tiền lãi kỳ hạn', 'Thưởng cuối năm'],
      expenseGroups: [
        {
          id: 'cg-saving-goals',
          name: 'Mục tiêu tài chính',
          color: '#eab308',
          categories: ['Dự phòng khẩn cấp', 'Du lịch xa', 'Đầu tư tích sản'],
        },
      ],
    },
  ],
  transactions: [
    {
      id: 't-init-1',
      type: 'income',
      amount: 18000000,
      walletId: 'w-bank',
      category: 'Lương chuyển khoản',
      note: 'Nhận lương tháng công ty',
      date: `${currentMonth}-05`,
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 't-init-2',
      type: 'transfer',
      amount: 3000000,
      walletId: 'w-bank',
      toWalletId: 'w-cash',
      category: 'Chuyển tiền nội bộ',
      note: 'Rút tiền mặt tiêu tuần',
      date: `${currentMonth}-06`,
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 't-init-3',
      type: 'transfer',
      amount: 1000000,
      walletId: 'w-bank',
      toWalletId: 'w-momo',
      category: 'Chuyển tiền nội bộ',
      note: 'Nạp ví Momo ăn trưa online',
      date: `${currentMonth}-06`,
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 't-init-4',
      type: 'expense',
      amount: 4500000,
      walletId: 'w-bank',
      category: 'Tiền thuê nhà',
      note: 'Thanh toán tiền nhà đầu tháng',
      date: `${currentMonth}-07`,
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 't-init-5',
      type: 'expense',
      amount: 650000,
      walletId: 'w-bank',
      category: 'Tiền điện',
      note: 'Hóa đơn EVN',
      date: `${currentMonth}-07`,
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 't-init-6',
      type: 'expense',
      amount: 65000,
      walletId: 'w-cash',
      category: 'Ăn sáng',
      note: 'Bún bò & cà phê',
      date: `${currentMonth}-08`,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 't-init-7',
      type: 'expense',
      amount: 120000,
      walletId: 'w-cash',
      category: 'Đổ xăng',
      note: 'Đầy bình xăng xe máy',
      date: `${currentMonth}-08`,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 't-init-8',
      type: 'expense',
      amount: 85000,
      walletId: 'w-momo',
      category: 'ShopeeFood',
      note: 'Cơm tấm trưa văn phòng',
      date: `${currentMonth}-08`,
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 't-init-9',
      type: 'expense',
      amount: 160000,
      walletId: 'w-momo',
      category: 'Mua sắm Shopee/Lazada',
      note: 'Mua phụ kiện điện thoại',
      date: `${currentMonth}-09`,
      createdAt: Date.now() - 86400000 * 1,
    },
  ],
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
