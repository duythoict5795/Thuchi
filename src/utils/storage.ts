import { AppState, Wallet, Transaction } from '../types/finance';
import { USER_WALLETS, USER_TRANSACTIONS } from '../data/userInitialData';
import { saveAppStateToDB } from './db';
import { syncStateToFirestore } from '../services/firebase';

export const STORAGE_KEY = 'quanlythuchi_v3_user_wallets';

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
  activeWalletId: 'w-cash',
  wallets: USER_WALLETS,
  transactions: USER_TRANSACTIONS,
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
  // Fast async database storage (IndexedDB)
  saveAppStateToDB(state).catch(() => {});
  // Cloud Database synchronization (Firebase Firestore)
  syncStateToFirestore(state).catch(() => {});
}
