import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

export interface Clase {
  id: number;
  nombre: string;
  descripcion: string;
  instructor: string;
  horario: string;
  dias: string;
  cupoTotal: number;
  inscritos: number;
}

@Component({
  selector: 'app-admin-clases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-clases.html',
  styleUrl: './admin-clases.css'
})
export class AdminClasesComponent implements OnInit {
  clases: Clase[] = [];
  cargando = false;

  // Modal
  modalAbierto = false;
  modoEdicion = false;
  claseEditando: Partial<Clase> = {};
  errores: string[] = [];

  // Confirmación de eliminación
  claseAEliminar: Clase | null = null;

  // Notificación
  notificacion = '';
  notificacionTimer: any = null;

  constructor(private supa: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    try {
      const data = await this.supa.getClases();
      this.clases = (data ?? []).map((c: any) => ({
        id:          c.id,
        nombre:      c.nombre,
        descripcion: c.descripcion ?? '',
        instructor:  c.instructor ?? '',
        horario:     c.horario ?? '',
        dias:        c.dias ?? '',
        cupoTotal:  c.cupo_total,
        inscritos:   c.inscritos
      }));
    } catch {
      this.mostrarNotificacion('Error al cargar clases.');
    } finally {
      this.cargando = false;
    }
  }

  // ---------- Crear ----------
  abrirCrear(): void {
    this.modoEdicion = false;
    this.claseEditando = { cupoTotal: 20, inscritos: 0 };
    this.errores = [];
    this.modalAbierto = true;
  }

  // ---------- Editar ----------
  abrirEditar(clase: Clase): void {
    this.modoEdicion = true;
    this.claseEditando = { ...clase };
    this.errores = [];
    this.modalAbierto = true;
  }

  // ---------- Guardar (crear o editar) ----------
  async guardar(): Promise<void> {
    this.errores = [];
    const c = this.claseEditando;

    if (!c.nombre?.trim())     this.errores.push('El nombre es obligatorio.');
    if (!c.instructor?.trim()) this.errores.push('El instructor es obligatorio.');
    if (!c.horario?.trim())    this.errores.push('El horario es obligatorio.');
    if (!c.dias?.trim())       this.errores.push('Los días son obligatorios.');
    if (!c.cupoTotal || c.cupoTotal < 1) this.errores.push('El cupo debe ser mayor a 0.');

    if (this.errores.length > 0) return;

    try {
      if (this.modoEdicion && c.id) {
        await this.supa.actualizarClase(c.id, {
          nombre:      c.nombre!.trim(),
          descripcion: c.descripcion?.trim() ?? '',
          instructor:  c.instructor!.trim(),
          horario:     c.horario!.trim(),
          dias:        c.dias!.trim(),
          cupo_total:  c.cupoTotal!
        });
        this.mostrarNotificacion('Clase actualizada correctamente.');
      } else {
        await this.supa.crearClase({
          nombre:      c.nombre!.trim(),
          descripcion: c.descripcion?.trim() ?? '',
          instructor:  c.instructor!.trim(),
          horario:     c.horario!.trim(),
          dias:        c.dias!.trim(),
          cupo_total:  c.cupoTotal!
        });
        this.mostrarNotificacion('Clase creada correctamente.');
      }
      await this.cargar();
      this.cerrarModal();
    } catch {
      this.errores.push('Error al guardar. Intenta de nuevo.');
    }
  }

  // ---------- Eliminar ----------
  pedirConfirmacion(clase: Clase): void {
    this.claseAEliminar = clase;
  }

  cancelarEliminar(): void {
    this.claseAEliminar = null;
  }

  async confirmarEliminar(): Promise<void> {
    if (!this.claseAEliminar) return;
    try {
      await this.supa.eliminarClase(this.claseAEliminar.id);
      this.mostrarNotificacion('Clase eliminada y sus inscripciones removidas.');
      this.claseAEliminar = null;
      await this.cargar();
    } catch {
      this.mostrarNotificacion('Error al eliminar la clase.');
    }
  }

  // ---------- Modal ----------
  cerrarModal(): void {
    this.modalAbierto = false;
    this.claseEditando = {};
    this.errores = [];
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrarModal();
    }
  }

  // ---------- Notificación ----------
  mostrarNotificacion(msg: string): void {
    this.notificacion = msg;
    if (this.notificacionTimer) clearTimeout(this.notificacionTimer);
    this.notificacionTimer = setTimeout(() => (this.notificacion = ''), 3500);
  }

  // ---------- Helpers ----------
  inscritosPct(clase: Clase): number {
    return clase.cupoTotal > 0 ? Math.round((clase.inscritos / clase.cupoTotal) * 100) : 0;
  }
}