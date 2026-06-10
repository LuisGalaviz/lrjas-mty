import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  const session = localStorage.getItem('admin_session');
  const expiry = localStorage.getItem('admin_session_expiry');

  if (session === 'true' && expiry) {
    const now = new Date().getTime();
    if (now < parseInt(expiry)) {
      return true;
    }
    // Sesión expirada — limpiar
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_session_expiry');
  }

  router.navigate(['/admin-login']);
  return false;
};