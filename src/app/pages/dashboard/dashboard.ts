import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  today = new Date();

  registros: any[] = [];
  asistencias: any[] = [];
  inscripciones: any[] = [];

  stats: { label: string; valor: number; color: string }[] = [];

  asistenciasHoy: any[] = [];
  ultimasAsistencias: any[] = [];

  motivosChart: { motivo: string; cantidad: number; pct: number }[] = [];
  clasesChart:  { clase:  string; cantidad: number; pct: number }[] = [];

  constructor(private supa: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    try {
      const [registros, asistencias, inscripciones] = await Promise.all([
        this.supa.getRegistros(),
        this.supa.getAsistencias(),
        this.supa.getInscripciones()
      ]);

      // Mapear snake_case de Supabase → camelCase que usa el HTML
      this.registros = (registros ?? []).map((r: any) => ({
        ...r,
        esMiembro:     r.es_miembro,
        fechaRegistro: r.fecha_registro
      }));

      this.asistencias = asistencias ?? [];

      this.inscripciones = (inscripciones ?? []).map((i: any) => ({
        ...i,
        claseNombre:      i.clase_nombre,
        nombreCompleto:   i.nombre_completo,
        fechaInscripcion: i.fecha_inscripcion
      }));

      const hoy = new Date().toISOString().split('T')[0];
      this.asistenciasHoy     = this.asistencias.filter(a => a.fecha?.startsWith(hoy));
      this.ultimasAsistencias = this.asistencias.slice(0, 8);

      this.stats = [
        { label: 'Personas registradas', valor: this.registros.length,      color: '#3b82f6' },
        { label: 'Asistencias totales',  valor: this.asistencias.length,    color: '#E8671A' },
        { label: 'Asistencias hoy',      valor: this.asistenciasHoy.length, color: '#22c55e' },
        { label: 'Inscripciones clases', valor: this.inscripciones.length,  color: '#a855f7' },
      ];

      this.buildMotivosChart();
      this.buildClasesChart();
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    }
  }

  buildMotivosChart(): void {
    const map: Record<string, number> = {};
    for (const a of this.asistencias) {
      map[a.motivo] = (map[a.motivo] || 0) + 1;
    }
    const total = this.asistencias.length || 1;
    this.motivosChart = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([motivo, cantidad]) => ({
        motivo, cantidad,
        pct: Math.round((cantidad / total) * 100)
      }));
  }

  buildClasesChart(): void {
    const map: Record<string, number> = {};
    for (const i of this.inscripciones) {
      const nombre = i.claseNombre ?? '';
      map[nombre] = (map[nombre] || 0) + 1;
    }
    const total = this.inscripciones.length || 1;
    this.clasesChart = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([clase, cantidad]) => ({
        clase, cantidad,
        pct: Math.round((cantidad / total) * 100)
      }));
  }

  formatFecha(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  logout(): void {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_session_expiry');
    window.location.href = '/';
  }
}