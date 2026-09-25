import { Routes } from '@angular/router';
import { adminGuard } from './admin/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'admin-login',
    loadComponent: () =>
      import('./admin/pages/admin-login/admin-login.page').then((m) => m.AdminLoginPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./admin/tabs/admin-tabs.routes').then((m) => m.ADMIN_TABS_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.TABS_ROUTES),
  },
];
