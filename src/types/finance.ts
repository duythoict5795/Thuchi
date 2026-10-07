export interface ExpenseGroup {
  id: string;
  name: string;
  color: string;
  categories: string[];
}

export interface Wallet {
  id: string;
  name: string;
  icon: 'wallet' | 'landmark' | 'smartphone' | 'credit-card' | 'piggy-bank' | 'briefcase';
  color: string;
  initialBalance: number;
  description?: string;
  incomeCategories: string[];
  expenseGroups: ExpenseGroup[];
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  walletId: string; // Source wallet
  toWalletId?: string; // Target wallet if transfer
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface AppState {
  wallets: Wallet[];
  transactions: Transaction[];
  activeWalletId: string; // 'all' for Ví Tổng Hợp, or wallet.id
}
