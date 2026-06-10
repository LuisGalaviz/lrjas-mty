import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLoginComponent {
  usuario = '';
  password = '';
  error = '';

  constructor(private router: Router) {
    // Si hay sesión activa válida, redirigir directo al dashboard
    const session = localStorage.getItem('admin_session');
    const expiry = localStorage.getItem('admin_session_expiry');
    if (session === 'true' && expiry) {
      const now = new Date().getTime();
      if (now < parseInt(expiry)) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        localStorage.removeItem('admin_session');
        localStorage.removeItem('admin_session_expiry');
      }
    }
  }

  login() {
    if (this.usuario === 'admin' && this.password === '123') {
      // Sesión válida por 8 horas
      const expiry = new Date().getTime() + (8 * 60 * 60 * 1000);
      localStorage.setItem('admin_session', 'true');
      localStorage.setItem('admin_session_expiry', expiry.toString());
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.error = 'Usuario o contraseña incorrectos';
    }
  }
}