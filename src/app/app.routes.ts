import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing').then(m => m.LandingComponent) },
  { path: 'registro', loadComponent: () => import('./pages/registro/registro').then(m => m.RegistroComponent) },
  { path: 'dudas', loadComponent: () => import('./pages/dudas/dudas').then(m => m.DudasComponent) },
  { path: 'clases-publico', loadComponent: () => import('./pages/clases-publico/clases-publico').then(m => m.ClasesPublicoComponent) },
  { path: 'asistencia', loadComponent: () => import('./pages/asistencia/asistencia').then(m => m.AsistenciaComponent) },
  { path: 'admin-login', loadComponent: () => import('./pages/admin-login/admin-login').then(m => m.AdminLoginComponent) },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'registros', loadComponent: () => import('./pages/admin-registros/admin-registros').then(m => m.AdminRegistrosComponent) },
      { path: 'clases', loadComponent: () => import('./pages/admin-clases/admin-clases').then(m => m.AdminClasesComponent) },
      { path: 'reservaciones', loadComponent: () => import('./pages/reservaciones/reservaciones').then(m => m.ReservacionesComponent) },
      { path: 'proveedores', loadComponent: () => import('./pages/proveedores/proveedores').then(m => m.ProveedoresComponent) },
      { path: 'vacantes', loadComponent: () => import('./pages/vacantes/vacantes').then(m => m.VacantesComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];