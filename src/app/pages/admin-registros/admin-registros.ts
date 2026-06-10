import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

// SheetJS — se carga dinámicamente via CDN en el HTML
declare const XLSX: any;

type Vista = 'asistencias' | 'registros' | 'clases';

@Component({
  selector: 'app-admin-registros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-registros.html',
  styleUrl: './admin-registros.css'
})
export class AdminRegistrosComponent implements OnInit {
  vista: Vista = 'asistencias';

  asistencias: any[] = [];
  registros: any[] = [];
  inscripciones: any[] = [];
  clasesDisponibles: { id: number; nombre: string }[] = [];

  // Filtros
  filtroNombre = '';
  filtroFecha = '';
  filtroClaseId: number | '' = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';

  // Eliminar persona
  personaAEliminar: any | null = null;

  // Desinscribir de clase
  inscripcionAEliminar: any | null = null;

  // Notificación
  notificacion = '';
  notificacionTimer: any = null;

  constructor(private supa: SupabaseService) {}

  ngOnInit(): void {
    this.cargarSheetJS();
    this.cargar();
  }

  cargarSheetJS(): void {
    if (typeof XLSX !== 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
    document.head.appendChild(script);
  }

  async cargar(): Promise<void> {
    try {
      const [asistencias, registros, inscripciones, clases] = await Promise.all([
        this.supa.getAsistencias(),
        this.supa.getRegistros(),
        this.supa.getInscripciones(),
        this.supa.getClases()
      ]);

      // Mapear nombres de campos snake_case → camelCase para compatibilidad con el HTML existente
      this.asistencias = (asistencias ?? []).map((a: any) => ({
        ...a,
        personaId: a.persona_id
      }));

      this.registros = (registros ?? []).map((r: any) => ({
        ...r,
        esMiembro:     r.es_miembro,
        fechaRegistro: r.fecha_registro
      }));

      this.inscripciones = (inscripciones ?? []).map((i: any) => ({
        ...i,
        personaId:        i.persona_id,
        claseId:          i.clase_id,
        nombreCompleto:   i.nombre_completo,
        claseNombre:      i.clase_nombre,
        fechaInscripcion: i.fecha_inscripcion
      }));

      this.clasesDisponibles = (clases ?? []).map((c: any) => ({ id: c.id, nombre: c.nombre }));
    } catch {
      this.mostrarNotificacion('Error al cargar datos.');
    }
  }

  setVista(v: Vista): void {
    this.vista = v;
    this.limpiarFiltros();
  }

  limpiarFiltros(): void {
    this.filtroNombre     = '';
    this.filtroFecha      = '';
    this.filtroClaseId    = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
  }

  private enRango(isoFecha: string): boolean {
    if (!this.filtroFechaDesde && !this.filtroFechaHasta) return true;
    const fecha = isoFecha.split('T')[0];
    const desdeOk = !this.filtroFechaDesde || fecha >= this.filtroFechaDesde;
    const hastaOk = !this.filtroFechaHasta || fecha <= this.filtroFechaHasta;
    return desdeOk && hastaOk;
  }

  get hayFiltroActivo(): boolean {
    return !!(this.filtroNombre || this.filtroFechaDesde || this.filtroFechaHasta || this.filtroClaseId);
  }

  get asistenciasFiltradas() {
    return this.asistencias.filter(a => {
      const nombreOk = !this.filtroNombre || a.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());
      const rangoOk  = this.enRango(a.fecha);
      return nombreOk && rangoOk;
    });
  }

  get registrosFiltrados() {
    return this.registros.filter(r => {
      const nombre = `${r.nombre} ${r.apellidos}`.toLowerCase();
      return !this.filtroNombre || nombre.includes(this.filtroNombre.toLowerCase());
    });
  }

  get inscripcionesFiltradas() {
    return this.inscripciones.filter(i => {
      const nombreOk = !this.filtroNombre  || i.nombreCompleto.toLowerCase().includes(this.filtroNombre.toLowerCase());
      const claseOk  = !this.filtroClaseId || i.claseId === Number(this.filtroClaseId);
      const rangoOk  = this.enRango(i.fechaInscripcion);
      return nombreOk && claseOk && rangoOk;
    });
  }

  asistenciasDe(nombreCompleto: string): number {
    return this.asistencias.filter(a => {
      const nombreOk = a.nombre.toLowerCase() === nombreCompleto.toLowerCase();
      const rangoOk  = this.enRango(a.fecha);
      return nombreOk && rangoOk;
    }).length;
  }

  asistenciasEnRango(nombreCompleto: string): number {
    return this.asistencias.filter(a =>
      a.nombre.toLowerCase() === nombreCompleto.toLowerCase() && this.enRango(a.fecha)
    ).length;
  }

  // ─── Eliminar persona ─────────────────────────────────────────────────────────
  pedirEliminarPersona(persona: any): void {
    this.personaAEliminar = persona;
  }

  cancelarEliminarPersona(): void {
    this.personaAEliminar = null;
  }

  async confirmarEliminarPersona(): Promise<void> {
    if (!this.personaAEliminar) return;
    const nombre = `${this.personaAEliminar.nombre} ${this.personaAEliminar.apellidos}`;
    try {
      // Las inscripciones y asistencias se eliminan en cascada (ON DELETE CASCADE en el SQL)
      await this.supa.eliminarRegistro(this.personaAEliminar.id);
      this.personaAEliminar = null;
      this.mostrarNotificacion(`${nombre} fue eliminado del sistema.`);
      await this.cargar();
    } catch {
      this.mostrarNotificacion('Error al eliminar. Intenta de nuevo.');
    }
  }

  // ─── Desinscribir de clase ────────────────────────────────────────────────────
  pedirDesinscribir(inscripcion: any): void {
    this.inscripcionAEliminar = inscripcion;
  }

  cancelarDesinscribir(): void {
    this.inscripcionAEliminar = null;
  }

  async confirmarDesinscribir(): Promise<void> {
    if (!this.inscripcionAEliminar) return;
    const ins = this.inscripcionAEliminar;
    try {
      await this.supa.eliminarInscripcion(ins.personaId, ins.claseId);
      await this.supa.sincronizarInscritos(ins.claseId);
      this.inscripcionAEliminar = null;
      this.mostrarNotificacion(`${ins.nombreCompleto} fue retirado de "${ins.claseNombre}".`);
      await this.cargar();
    } catch {
      this.mostrarNotificacion('Error al desinscribir. Intenta de nuevo.');
    }
  }

  // ─── Notificación ─────────────────────────────────────────────────────────────
  mostrarNotificacion(msg: string): void {
    this.notificacion = msg;
    if (this.notificacionTimer) clearTimeout(this.notificacionTimer);
    this.notificacionTimer = setTimeout(() => (this.notificacion = ''), 3500);
  }

  // ─── Resúmenes ────────────────────────────────────────────────────────────────
  get motivoResumen(): { motivo: string; cantidad: number; pct: number }[] {
    const fuente = this.hayFiltroActivo ? this.asistenciasFiltradas : this.asistencias;
    const map: Record<string, number> = {};
    for (const a of fuente) map[a.motivo] = (map[a.motivo] || 0) + 1;
    const total = fuente.length || 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([motivo, cantidad]) => ({ motivo, cantidad, pct: Math.round((cantidad / total) * 100) }));
  }

  get claseResumen(): { clase: string; cantidad: number; pct: number }[] {
    const fuente = this.hayFiltroActivo ? this.inscripcionesFiltradas : this.inscripciones;
    const map: Record<string, number> = {};
    for (const i of fuente) map[i.claseNombre] = (map[i.claseNombre] || 0) + 1;
    const total = fuente.length || 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([clase, cantidad]) => ({ clase, cantidad, pct: Math.round((cantidad / total) * 100) }));
  }

  // ─── Exportar Excel ──────────────────────────────────────────────────────────
  exportarExcel(): void {
    if (typeof XLSX === 'undefined') {
      alert('La librería de exportación aún está cargando. Intenta en un momento.');
      return;
    }
    const wb = XLSX.utils.book_new();

    const asistRows = this.asistenciasFiltradas.map((a: any) => ({
      'Nombre':       a.nombre,
      'Motivo':       a.motivo,
      'Fecha y hora': this.formatFecha(a.fecha)
    }));
    const wsAsist = XLSX.utils.json_to_sheet(asistRows.length ? asistRows : [{ 'Sin datos': '' }]);
    this.autoWidth(wsAsist, asistRows);
    XLSX.utils.book_append_sheet(wb, wsAsist, 'Asistencias');

    const regRows = this.registrosFiltrados.map((r: any) => ({
      'Nombre completo': `${r.nombre} ${r.apellidos}`,
      'Teléfono':        r.telefono,
      'Estaca':          r.estaca,
      'Barrio':          r.barrio,
      'Membresía':       r.esMiembro ? 'Miembro' : 'Investigador',
      'Fecha registro':  this.formatFechaSolo(r.fechaRegistro)
    }));
    const wsReg = XLSX.utils.json_to_sheet(regRows.length ? regRows : [{ 'Sin datos': '' }]);
    this.autoWidth(wsReg, regRows);
    XLSX.utils.book_append_sheet(wb, wsReg, 'Personas');

    const inscRows = this.inscripcionesFiltradas.map((i: any) => ({
      'Nombre':              i.nombreCompleto,
      'Clase':               i.claseNombre,
      'Fecha inscripción':   this.formatFechaSolo(i.fechaInscripcion),
      'Asistencias (rango)': this.asistenciasEnRango(i.nombreCompleto)
    }));
    const wsInsc = XLSX.utils.json_to_sheet(inscRows.length ? inscRows : [{ 'Sin datos': '' }]);
    this.autoWidth(wsInsc, inscRows);
    XLSX.utils.book_append_sheet(wb, wsInsc, 'Inscripciones');

    const resRows = this.claseResumen.map(c => ({
      'Clase':      c.clase,
      'Inscritos':  c.cantidad,
      'Porcentaje': `${c.pct}%`
    }));
    const wsRes = XLSX.utils.json_to_sheet(resRows.length ? resRows : [{ 'Sin datos': '' }]);
    this.autoWidth(wsRes, resRows);
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen Clases');

    const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    XLSX.writeFile(wb, `LRJAS_Registros_${fecha}.xlsx`);
  }

  private autoWidth(ws: any, data: any[]): void {
    if (!data.length) return;
    const cols = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] ?? '').length)) + 2
    }));
    ws['!cols'] = cols;
  }

  formatFecha(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatFechaSolo(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}