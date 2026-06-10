import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

export interface Clase {
  id: number;
  nombre: string;
  descripcion: string;
  instructor: string;
  horario: string;
  dias: string;
  cupo_total: number;
  inscritos: number;
}

interface PersonaFiltrada {
  id: number;
  nombreCompleto: string;
  telefono: string;
  estaca: string;
  barrio: string;
  esMiembro: boolean | null;
}

@Component({
  selector: 'app-clases-publico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clases-publico.html',
  styleUrls: ['./clases-publico.css']
})
export class ClasesPublicoComponent implements OnInit {
  clasesDisponibles: Clase[] = [];
  personasRegistradas: PersonaFiltrada[] = [];

  claseSeleccionada: Clase | null = null;
  busqueda = '';
  personaSeleccionada: PersonaFiltrada | null = null;
  inscripcionExitosa = false;
  cargando = false;
  cargandoInscripcion = false;
  errorGeneral = '';
  yaInscritoFlag = false;

  // Cache: personaId → ya inscrito en la clase abierta
  private inscritosCache = new Map<number, boolean>();

  constructor(private supa: SupabaseService, private cdr: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
  this.cargando = true;
  try {
    const clases = await this.supa.getClases();
    this.clasesDisponibles = (clases ?? []).map((c: any) => ({
      id:          c.id,
      nombre:      c.nombre,
      descripcion: c.descripcion,
      instructor:  c.instructor,
      horario:     c.horario,
      dias:        c.dias,
      cupo_total:  c.cupo_total,
      inscritos:   c.inscritos
    }));
    this.cdr.markForCheck();
  } catch (err: any) {
    console.error('Error cargando clases:', err);
    this.errorGeneral = 'Error al cargar clases.';
  } finally {
    this.cargando = false;
  }

  // Cargar personas por separado — si falla no bloquea las clases
  try {
    const registros = await this.supa.getRegistros();
    this.personasRegistradas = (registros ?? []).map((r: any) => ({
      id:             r.id,
      nombreCompleto: `${r.nombre} ${r.apellidos}`,
      telefono:       r.telefono,
      estaca:         r.estaca,
      barrio:         r.barrio,
      esMiembro:      r.es_miembro
    }));
    this.cdr.markForCheck();
  } catch (err: any) {
    console.error('Error cargando personas:', err);
  }
}

  get personasFiltradas(): PersonaFiltrada[] {
    if (!this.busqueda.trim()) return [];
    return this.personasRegistradas.filter(p =>
      p.nombreCompleto.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  ultimos4(telefono: string): string {
    return telefono.replace(/\D/g, '').slice(-4);
  }

  formatNumero(num: number): string {
    return String(num).padStart(2, '0');
  }

  abrirModal(clase: Clase): void {
    this.claseSeleccionada = clase;
    this.resetForm();
  }

  // Método síncrono requerido por el HTML — lee del cache
  yaInscrito(personaId: number): boolean {
    return this.inscritosCache.get(personaId) ?? false;
  }

  async seleccionarPersona(persona: PersonaFiltrada): Promise<void> {
    this.personaSeleccionada = persona;
    if (this.claseSeleccionada) {
      const inscrito = await this.supa.yaInscrito(persona.id, this.claseSeleccionada.id);
      this.yaInscritoFlag = inscrito;
      this.inscritosCache.set(persona.id, inscrito);
      this.cdr.markForCheck();
    }
  }

  get yaInscritoSeleccionado(): boolean {
    return this.yaInscritoFlag;
  }

  async handleInscribir(): Promise<void> {
    if (!this.personaSeleccionada || !this.claseSeleccionada || this.cargandoInscripcion) return;
    if (this.yaInscritoSeleccionado) return;

    this.cargandoInscripcion = true;
    try {
      await this.supa.crearInscripcion({
        persona_id:      this.personaSeleccionada.id,
        clase_id:        this.claseSeleccionada.id,
        nombre_completo: this.personaSeleccionada.nombreCompleto,
        clase_nombre:    this.claseSeleccionada.nombre
      });
      await this.supa.sincronizarInscritos(this.claseSeleccionada.id);

      const clase = this.clasesDisponibles.find(c => c.id === this.claseSeleccionada!.id);
      if (clase) clase.inscritos++;

      this.inscritosCache.set(this.personaSeleccionada.id, true);
      this.yaInscritoFlag = true;
      this.inscripcionExitosa = true;
      this.cdr.markForCheck();
    } catch {
      this.errorGeneral = 'Error al inscribirse. Intenta de nuevo.';
    } finally {
      this.cargandoInscripcion = false;
    }
  }

  cerrarModal(): void {
    this.claseSeleccionada = null;
    this.resetForm();
  }

  resetForm(): void {
    this.busqueda = '';
    this.personaSeleccionada = null;
    this.inscripcionExitosa = false;
    this.yaInscritoFlag = false;
    this.inscritosCache.clear();
    this.errorGeneral = '';
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrarModal();
    }
  }

  limpiarSeleccion(): void {
    this.personaSeleccionada = null;
    this.yaInscritoFlag = false;
  }
}