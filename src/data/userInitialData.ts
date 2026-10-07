import part1 from './cashTransactionsPart1.json';
import part2 from './cashTransactionsPart2.json';
import part3 from './cashTransactionsPart3.json';
import part4 from './cashTransactionsPart4.json';
import { Wallet, Transaction } from '../types/finance';

export const USER_TRANSACTIONS: Transaction[] = [
  ...part1,
  ...part2,
  ...part3,
  ...part4,
] as Transaction[];

export const USER_WALLETS: Wallet[] = [
  {
    id: 'w-cash',
    name: 'Tiền mặt',
    icon: 'wallet',
    color: '#10b981',
    initialBalance: 0,
    description: 'Ví tiền mặt chi tiêu hàng ngày',
    incomeCategories: [
      'Lương',
      'Thưởng',
      'chạy xe',
      'tiền mặt rút sẳn',
      'khác',
      'viettinbank',
      'vietcombank',
      'mbbank'
    ],
    expenseGroups: [
      {
        id: 'g1',
        name: 'Ăn uống',
        color: '#f87171',
        categories: ['Ăn sáng', 'Ăn trưa', 'Ăn chiều', 'Ăn tối', 'Ăn vặt']
      },
      {
        id: 'g2',
        name: 'Sinh hoạt',
        color: '#60a5fa',
        categories: ['Tiền điện', 'Tiền nước', 'Youtube Premium', 'Hớt tóc', 'Tiền Gas']
      },
      {
        id: 'g3',
        name: 'Di chuyển',
        color: '#fbbf24',
        categories: ['Xăng xe', 'Sửa xe', 'Qua đò']
      },
      {
        id: 'g4',
        name: 'Mua sấm',
        color: '#3f8ecf',
        categories: ['mua online', 'mua sấm nhà cửa']
      },
      {
        id: 'g5',
        name: 'vợ chi',
        color: '#d91fb2',
        categories: ['đưa vợ', 'đóng hụi', 'lấy đồ shiper']
      },
      {
        id: 'g6',
        name: 'Đi chơi',
        color: '#89855d',
        categories: ['đi chơi gần', 'đi chơi xa']
      },
      {
        id: 'g7',
        name: 'Đám tiệc',
        color: '#c555e2',
        categories: ['thùng bia', 'phong bì', 'hoa quà', 'lì xì', 'mua mòi']
      },
      {
        id: 'g8',
        name: 'Khác',
        color: '#94a3b8',
        categories: ['Phát sinh', 'lặt vặt', 'bỏ óng', 'lệt']
      }
    ]
  },
  {
    id: 'w-vietinbank',
    name: 'Vietinbank',
    icon: 'landmark',
    color: '#0284c7',
    initialBalance: 0,
    description: 'Tài khoản ngân hàng Vietinbank',
    incomeCategories: ['Lương', 'Thưởng', 'Chuyển khoản', 'Khác'],
    expenseGroups: [
      {
        id: 'g-vietin-bills',
        name: 'Hóa đơn & Mua sắm',
        color: '#0284c7',
        categories: ['Tiền điện', 'Tiền nước', 'Mua online', 'Khác']
      }
    ]
  },
  {
    id: 'w-vietcombank',
    name: 'Vietcombank',
    icon: 'landmark',
    color: '#16a34a',
    initialBalance: 0,
    description: 'Tài khoản ngân hàng Vietcombank',
    incomeCategories: ['Lương', 'Thưởng', 'Chuyển khoản', 'Khác'],
    expenseGroups: [
      {
        id: 'g-vcb-bills',
        name: 'Hóa đơn & Mua sắm',
        color: '#16a34a',
        categories: ['Tiền điện', 'Tiền nước', 'Mua online', 'Khác']
      }
    ]
  },
  {
    id: 'w-vietinbank-2',
    name: 'Vietinbank 2',
    icon: 'landmark',
    color: '#0369a1',
    initialBalance: 0,
    description: 'Tài khoản Vietinbank 2',
    incomeCategories: ['Lương', 'Thưởng', 'Chuyển khoản', 'Khác'],
    expenseGroups: [
      {
        id: 'g-vietin2-bills',
        name: 'Hóa đơn & Mua sắm',
        color: '#0369a1',
        categories: ['Tiết kiệm', 'Chi tiêu', 'Khác']
      }
    ]
  }
];
