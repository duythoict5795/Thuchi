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
  const isNegative = num < 0;
  const formatted = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNegative ? `-${formatted}` : formatted;
}

export function parseFormattedNumber(str: string): number {
  if (!str) return 0;
  const isNegative = str.trim().startsWith('-');
  const clean = str.replace(/[^\d]/g, '');
  if (!clean) return 0;
  const val = parseInt(clean, 10);
  return isNegative ? -val : val;
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

export function calculateTotalBalance(
  wallets: Wallet[],
  transactions: Transaction[],
  summaryWalletIds?: string[]
): number {
  const targetWallets =
    summaryWalletIds && summaryWalletIds.length > 0
      ? wallets.filter((w) => summaryWalletIds.includes(w.id))
      : wallets;

  return targetWallets.reduce((total, wallet) => {
    return total + calculateWalletBalance(wallet.id, wallets, transactions);
  }, 0);
}

export function getMonthStats(
  monthStr: string,
  walletId: string,
  transactions: Transaction[],
  summaryWalletIds?: string[]
) {
  let income = 0;
  let expense = 0;

  const includedSet =
    summaryWalletIds && summaryWalletIds.length > 0 ? new Set(summaryWalletIds) : null;

  for (const t of transactions) {
    if (!t.date.startsWith(monthStr)) continue;

    if (walletId === 'all') {
      // Ví Tổng Hợp: chỉ tính các ví được tích chọn trong summaryWalletIds
      const isSourceIncluded = includedSet ? includedSet.has(t.walletId) : true;
      const isTargetIncluded = t.toWalletId
        ? includedSet
          ? includedSet.has(t.toWalletId)
          : true
        : false;

      if (t.type === 'income') {
        if (isSourceIncluded) income += t.amount;
      } else if (t.type === 'expense') {
        if (isSourceIncluded) expense += t.amount;
      } else if (t.type === 'transfer') {
        // Chuyển tiền giữa ví được tính và ví bị loại trừ:
        // Chuyển từ ví được tính sang ví bị loại trừ -> tiền ra khỏi tổng hợp
        // Chuyển từ ví bị loại trừ vào ví được tính -> tiền vào tổng hợp
        if (isSourceIncluded && !isTargetIncluded) {
          expense += t.amount;
        } else if (!isSourceIncluded && isTargetIncluded) {
          income += t.amount;
        }
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
  summaryWalletIds: USER_WALLETS.map((w) => w.id),
};

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed.wallets || !Array.isArray(parsed.wallets) || parsed.wallets.length === 0) {
      return DEFAULT_STATE;
    }
    if (!parsed.summaryWalletIds || !Array.isArray(parsed.summaryWalletIds)) {
      parsed.summaryWalletIds = parsed.wallets.map((w: Wallet) => w.id);
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
