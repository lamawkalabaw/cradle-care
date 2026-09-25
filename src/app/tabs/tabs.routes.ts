import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { customerGuard } from '../admin/guards/customer.guard';

export const TABS_ROUTES: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      { path: 'home', canActivate: [customerGuard], loadComponent: () => import('../pages/home/home.page').then((m) => m.HomePage) },
      { path: 'shop', canActivate: [customerGuard], loadComponent: () => import('../pages/shop/shop.page').then((m) => m.ShopPage) },
      { path: 'wishlist', canActivate: [customerGuard], loadComponent: () => import('../pages/wishlist/wishlist.page').then((m) => m.WishlistPage) },
      { path: 'cart', canActivate: [customerGuard], loadComponent: () => import('../pages/cart/cart.page').then((m) => m.CartPage) },
      { path: 'account', loadComponent: () => import('../pages/account/account.page').then((m) => m.AccountPage) },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
