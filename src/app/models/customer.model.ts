export type CustomerStatus = 'active' | 'blocked';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  ordersCount: number;
  totalSpent: number;
  status: CustomerStatus;
  zip?: string;
  address?: string;
  billing?: string;
}
