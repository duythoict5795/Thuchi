import React from 'react';
import {
  Wallet as WalletIconLucide,
  Landmark,
  Smartphone,
  CreditCard,
  PiggyBank,
  Briefcase,
} from 'lucide-react';
import { Wallet } from '../types/finance';

interface WalletIconProps {
  icon: Wallet['icon'];
  className?: string;
}

export const WalletIcon: React.FC<WalletIconProps> = ({ icon, className = 'w-5 h-5' }) => {
  switch (icon) {
    case 'landmark':
      return <Landmark className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'credit-card':
      return <CreditCard className={className} />;
    case 'piggy-bank':
      return <PiggyBank className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'wallet':
    default:
      return <WalletIconLucide className={className} />;
  }
};
