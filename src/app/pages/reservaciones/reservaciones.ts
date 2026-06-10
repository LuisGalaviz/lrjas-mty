import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservaciones.html',
  styleUrl: './reservaciones.css'
})
export class ReservacionesComponent implements OnInit {
  filtro = 'todas';
  busqueda = '';
  reservaciones: any[] = [];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.reservaciones = JSON.parse(localStorage.getItem('reservaciones') || '[]');
  }

  get reservacionesFiltradas() {
    return this.reservaciones.filter(r => {
      const matchFiltro = this.filtro === 'todas' || r.estado === this.filtro;
      const matchBusqueda = r.nombre?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
                            r.telefono?.includes(this.busqueda);
      return matchFiltro && matchBusqueda;
    });
  }

  cambiarEstado(reservacion: any, estado: string) {
    reservacion.estado = estado;
    localStorage.setItem('reservaciones', JSON.stringify(this.reservaciones));
  }

  eliminar(id: number) {
    this.reservaciones = this.reservaciones.filter(r => r.id !== id);
    localStorage.setItem('reservaciones', JSON.stringify(this.reservaciones));
  }

  get totalConfirmadas() { return this.reservaciones.filter(r => r.estado === 'confirmada').length; }
  get totalPendientes() { return this.reservaciones.filter(r => r.estado === 'pendiente').length; }
  get totalCanceladas() { return this.reservaciones.filter(r => r.estado === 'cancelada').length; }
}