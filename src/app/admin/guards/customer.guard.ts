import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const customerGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitForReady();

  if (authService.isLoggedIn()) {
    return true;
  }
  router.navigate(['/account']);
  return false;
};
