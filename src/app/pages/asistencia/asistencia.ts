import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

const MOTIVOS_EXTRA = ['Actividad de domingo', 'Jugar', 'Platicar', 'Otro'];

interface Persona {
  id: number;
  nombreCompleto: string;
  ultimos4: string;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css'
})
export class AsistenciaComponent implements OnInit {
  paso: 1 | 2 = 1;
  enviado = false;
  cargando = false;
  errorGeneral = '';

  // Paso 1
  busqueda = '';
  todasLasPersonas: Persona[] = [];
  personaSeleccionada: Persona | null = null;
  mostrarLista = false;

  // Paso 2
  motivoSeleccionado = '';
  motivosDisponibles: string[] = [];

  constructor(private supa: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    try {
      const [registros, clases] = await Promise.all([
        this.supa.getRegistros(),
        this.supa.getClases()
      ]);

      this.todasLasPersonas = (registros ?? []).map((r: any) => ({
        id: r.id,
        nombreCompleto: `${r.nombre} ${r.apellidos}`,
        ultimos4: String(r.telefono || '').replace(/\D/g, '').slice(-4)
      }));

      const nombresClases = (clases ?? []).map((c: any) => c.nombre);
      this.motivosDisponibles = [...nombresClases, ...MOTIVOS_EXTRA];
    } catch (err: any) {
      console.error('Error asistencia:', err);
      this.errorGeneral = 'Error al cargar datos. Verifica tu conexión.';
    }
  }

  get personasFiltradas(): Persona[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return this.todasLasPersonas.filter(p =>
      p.nombreCompleto.toLowerCase().includes(q)
    );
  }

  onBusquedaChange(): void {
    if (this.personaSeleccionada && this.busqueda !== this.personaSeleccionada.nombreCompleto) {
      this.personaSeleccionada = null;
    }
    this.mostrarLista = true;
  }

  elegirPersona(p: Persona): void {
    this.personaSeleccionada = p;
    this.busqueda = p.nombreCompleto;
    this.mostrarLista = false;
  }

  limpiarSeleccion(): void {
    this.personaSeleccionada = null;
    this.busqueda = '';
    this.mostrarLista = false;
  }

  get puedeAvanzar(): boolean {
    return this.personaSeleccionada !== null;
  }

  siguientePaso(): void {
    if (this.puedeAvanzar) this.paso = 2;
  }

  async guardar(): Promise<void> {
  if (!this.personaSeleccionada || !this.motivoSeleccionado || this.cargando) return;
  this.cargando = true;
  this.errorGeneral = '';
  try {
    // Verificar si ya tiene asistencia hoy
    const hoy = new Date().toISOString().split('T')[0];
    const asistencias = await this.supa.getAsistencias();
    const yaRegistroHoy = (asistencias ?? []).some((a: any) =>
      a.persona_id === this.personaSeleccionada!.id &&
      a.fecha?.startsWith(hoy)
    );

    if (!yaRegistroHoy) {
      await this.supa.crearAsistencia({
        persona_id: this.personaSeleccionada.id,
        nombre:     this.personaSeleccionada.nombreCompleto,
        motivo:     this.motivoSeleccionado
      });
    }

    this.enviado = true;
  } catch (err: any) {
    console.error('Error asistencia:', err);
    this.errorGeneral = 'Error al guardar la asistencia. Intenta de nuevo.';
  } finally {
    this.cargando = false;
  }
}

  async resetear(): Promise<void> {
    this.paso = 1;
    this.busqueda = '';
    this.personaSeleccionada = null;
    this.motivoSeleccionado = '';
    this.enviado = false;
    this.mostrarLista = false;
    this.errorGeneral = '';

    // Recargar clases por si cambiaron
    try {
      const clases = await this.supa.getClases();
      const nombresClases = (clases ?? []).map((c: any) => c.nombre);
      this.motivosDisponibles = [...nombresClases, ...MOTIVOS_EXTRA];
    } catch (err: any) {
      console.error('Error asistencia:', err);}
  }
}