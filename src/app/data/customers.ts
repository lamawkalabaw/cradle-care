import { Customer } from '../models/customer.model';

/* Seed data standing in for a customers backend/API */
export const SEED_CUSTOMERS: Customer[] = [
  { id: 'cus_1001', name: 'Ana Reyes',      email: 'ana.reyes@example.com',      phone: '(555) 201-3345', joinedAt: '2026-04-02', ordersCount: 6,  totalSpent: 0, status: 'active' },
  { id: 'cus_1002', name: 'Marco DeLuca',    email: 'marco.deluca@example.com',   phone: '(555) 118-9042', joinedAt: '2026-05-14', ordersCount: 3,  totalSpent: 0, status: 'active' },
  { id: 'cus_1003', name: 'Priya Shah',      email: 'priya.shah@example.com',     phone: '(555) 774-2201', joinedAt: '2026-01-27', ordersCount: 11, totalSpent: 0, status: 'active' },
  { id: 'cus_1004', name: 'Jamie Lee',       email: 'jamie.lee@example.com',      phone: '(555) 330-8871', joinedAt: '2026-06-09', ordersCount: 1,  totalSpent: 0, status: 'active' },
  { id: 'cus_1005', name: 'Devon Carter',    email: 'devon.carter@example.com',   phone: '(555) 902-1187', joinedAt: '2025-11-30', ordersCount: 8,  totalSpent: 0, status: 'active' },
  { id: 'cus_1006', name: 'Sofia Nakamura',  email: 'sofia.nakamura@example.com', phone: '(555) 445-6620', joinedAt: '2026-03-18', ordersCount: 4,  totalSpent: 0, status: 'active' },
  { id: 'cus_1007', name: 'Tomás Herrera',   email: 'tomas.herrera@example.com',  phone: '(555) 667-0093', joinedAt: '2026-07-22', ordersCount: 2,  totalSpent: 0, status: 'active' },
];