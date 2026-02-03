
export const ViewState = {
  HOME: 'HOME',
  LOTTERY_DETAIL: 'LOTTERY_DETAIL',
  MILLIONAIRE_BAG: 'MILLIONAIRE_BAG',
  CONFIRMATION: 'CONFIRMATION',
  LOGIN: 'LOGIN',
  DASHBOARD: 'DASHBOARD'
} as const;

export type ViewState = typeof ViewState[keyof typeof ViewState];

export type Role = 'superadmin' | 'admin' | 'public';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  token?: string;
  password?: string;
  status?: 'active' | 'suspended' | 'pending';
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Role; 
  status?: 'active' | 'pending';
}

export interface Lottery {
  id: string;
  title: string;
  description: string;
  prize: string;
  totalNumbers: number;
  pricePerNumber: number;
  soldNumbers: number[]; 
  status: 'active' | 'completed' | 'upcoming' | 'paused';
  drawDate: string;
  image: string;
  createdBy?: string;
  contactPhone?: string;
  winningNumber?: number;
  drawNarrative?: string;
}

export interface PurchaseRequest {
  lotteryId: string;
  buyerName: string;
  email: string;
  selectedNumbers: number[];
  totalAmount: number;
}

export interface Purchase extends PurchaseRequest {
  id: string;
  status: 'pending' | 'confirmed' | 'rejected';
  purchaseDate: string;
  lotteryTitle?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalAdmins: number;
  totalLotteries: number;
  activeLotteries: number;
  totalRevenue: number;
  pendingPayments: number;
}
