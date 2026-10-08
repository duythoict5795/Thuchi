import { Wallet } from '../types/finance';

export interface GradientOption {
  id: string;
  label: string;
  color: string;
  gradient: string;
}

export const WALLET_GRADIENTS: GradientOption[] = [
  {
    id: 'emerald',
    label: 'Xanh Ngọc / Tiền mặt',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
  },
  {
    id: 'ocean',
    label: 'Xanh Đại Dương / Vietinbank',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e40af 100%)',
  },
  {
    id: 'forest',
    label: 'Xanh Lá / Vietcombank',
    color: '#16a34a',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
  },
  {
    id: 'sky',
    label: 'Xanh Biển Nhẹ',
    color: '#0369a1',
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #0369a1 100%)',
  },
  {
    id: 'indigo',
    label: 'Tím Indigo Quý Phái',
    color: '#4f46e5',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3730a3 100%)',
  },
  {
    id: 'purple',
    label: 'Tím Hoàng Gia',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #6d28d9 100%)',
  },
  {
    id: 'pink',
    label: 'Hồng MoMo Nổi Bật',
    color: '#db2777',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #be185d 100%)',
  },
  {
    id: 'sunset',
    label: 'Cam Hoàng Hôn',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #c2410c 100%)',
  },
  {
    id: 'amber',
    label: 'Vàng Ánh Kim',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #b45309 100%)',
  },
  {
    id: 'teal',
    label: 'Xanh Ngọc Bích',
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 50%, #0f766e 100%)',
  },
  {
    id: 'ruby',
    label: 'Đỏ Ruby Quyến Rũ',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #b91c1c 100%)',
  },
  {
    id: 'charcoal',
    label: 'Xám Than Sang Trọng',
    color: '#475569',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 50%, #1e293b 100%)',
  },
];

const ALL_WALLETS_GRADIENT =
  'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)';

/**
 * Returns a beautiful CSS gradient string for any wallet, color string, or the total wallet view.
 */
export function getWalletGradient(
  walletOrColor?: Wallet | string | null,
  isAll?: boolean
): string {
  if (isAll) {
    return ALL_WALLETS_GRADIENT;
  }

  if (!walletOrColor) {
    return ALL_WALLETS_GRADIENT;
  }

  // If a string was passed directly
  if (typeof walletOrColor === 'string') {
    if (walletOrColor.startsWith('linear-gradient')) {
      return walletOrColor;
    }
    const matched = WALLET_GRADIENTS.find(
      (g) => g.color.toLowerCase() === walletOrColor.toLowerCase()
    );
    if (matched) return matched.gradient;
    return `linear-gradient(135deg, ${walletOrColor} 0%, #1e293b 100%)`;
  }

  // If a Wallet object was passed
  const wallet = walletOrColor;
  if (wallet.color && wallet.color.startsWith('linear-gradient')) {
    return wallet.color;
  }

  // Match by wallet id presets
  if (wallet.id === 'w-cash' || wallet.name.toLowerCase().includes('tiền mặt')) {
    return 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)';
  }
  if (wallet.id === 'w-vietinbank' || wallet.name.toLowerCase().includes('vietinbank 2')) {
    return 'linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #0369a1 100%)';
  }
  if (wallet.name.toLowerCase().includes('vietinbank')) {
    return 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e40af 100%)';
  }
  if (wallet.id === 'w-vietcombank' || wallet.name.toLowerCase().includes('vietcombank')) {
    return 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)';
  }

  // Match by color
  if (wallet.color) {
    const matched = WALLET_GRADIENTS.find(
      (g) => g.color.toLowerCase() === wallet.color.toLowerCase()
    );
    if (matched) return matched.gradient;
    return `linear-gradient(135deg, ${wallet.color} 0%, #1e293b 100%)`;
  }

  return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3730a3 100%)';
}
