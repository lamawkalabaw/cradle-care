import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  await authService.waitForReady();

  if (authService.isAdmin()) {
    return true;
  }
  router.navigate(['/admin-login']);
  return false;
};
