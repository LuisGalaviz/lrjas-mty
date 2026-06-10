import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vacantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vacantes.html',
  styleUrl: './vacantes.css'
})
export class VacantesComponent implements OnInit {
  busqueda = '';
  filtroVacante = 'todas';
  candidatos: any[] = [];

  vacantesDisponibles = [
    'todas', 'Chef de Cocina', 'Mesero/a', 'Bartender', 'Hostess', 'Auxiliar de Cocina', 'Cajero/a'
  ];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.candidatos = JSON.parse(localStorage.getItem('candidatos') || '[]');
  }

  get candidatosFiltrados() {
    return this.candidatos.filter(c => {
      const matchVacante = this.filtroVacante === 'todas' || c.vacante === this.filtroVacante;
      const matchBusqueda = c.nombre?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
                            c.vacante?.toLowerCase().includes(this.busqueda.toLowerCase());
      return matchVacante && matchBusqueda;
    });
  }

  cambiarEstado(candidato: any, estado: string) {
    candidato.estado = estado;
    localStorage.setItem('candidatos', JSON.stringify(this.candidatos));
  }

  eliminar(id: number) {
    this.candidatos = this.candidatos.filter(c => c.id !== id);
    localStorage.setItem('candidatos', JSON.stringify(this.candidatos));
  }

  get totalPendientes() { return this.candidatos.filter(c => c.estado === 'pendiente').length; }
  get totalEntrevista() { return this.candidatos.filter(c => c.estado === 'entrevista').length; }
  get totalContratados() { return this.candidatos.filter(c => c.estado === 'contratado').length; }
}