import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ─── REGISTROS ────────────────────────────────────────────────────────────────

  async getRegistros() {
    const { data, error } = await this.supabase
      .from('registros')
      .select('*')
      .order('fecha_registro', { ascending: false });
    if (error) throw error;
    return data;
  }

  async buscarPorTelefono(telefono: string) {
    const { data, error } = await this.supabase
      .from('registros')
      .select('id')
      .eq('telefono', telefono)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async crearRegistro(registro: {
    nombre: string;
    apellidos: string;
    telefono: string;
    es_miembro: boolean;
    estaca: string;
    barrio: string;
  }) {
    const { data, error } = await this.supabase
      .from('registros')
      .insert(registro)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async eliminarRegistro(id: number) {
    const { error } = await this.supabase
      .from('registros')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // ─── CLASES ───────────────────────────────────────────────────────────────────

  async getClases() {
    const { data, error } = await this.supabase
      .from('clases')
      .select('*')
      .order('id');
    if (error) throw error;
    return data;
  }

  async crearClase(clase: {
    nombre: string;
    descripcion: string;
    instructor: string;
    horario: string;
    dias: string;
    cupo_total: number;
  }) {
    const { data, error } = await this.supabase
      .from('clases')
      .insert({ ...clase, inscritos: 0 })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizarClase(id: number, cambios: Partial<{
    nombre: string;
    descripcion: string;
    instructor: string;
    horario: string;
    dias: string;
    cupo_total: number;
  }>) {
    const { data, error } = await this.supabase
      .from('clases')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async eliminarClase(id: number) {
    const { error } = await this.supabase
      .from('clases')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async sincronizarInscritos(claseId: number) {
    const { count, error } = await this.supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('clase_id', claseId);
    if (error) throw error;
    await this.supabase
      .from('clases')
      .update({ inscritos: count ?? 0 })
      .eq('id', claseId);
  }

  // ─── INSCRIPCIONES ────────────────────────────────────────────────────────────

  async getInscripciones() {
    const { data, error } = await this.supabase
      .from('inscripciones')
      .select('*')
      .order('fecha_inscripcion', { ascending: false });
    if (error) throw error;
    return data;
  }

  async yaInscrito(personaId: number, claseId: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('inscripciones')
      .select('id')
      .eq('persona_id', personaId)
      .eq('clase_id', claseId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async crearInscripcion(inscripcion: {
    persona_id: number;
    clase_id: number;
    nombre_completo: string;
    clase_nombre: string;
  }) {
    const { data, error } = await this.supabase
      .from('inscripciones')
      .insert(inscripcion)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async eliminarInscripcion(personaId: number, claseId: number) {
    const { error } = await this.supabase
      .from('inscripciones')
      .delete()
      .eq('persona_id', personaId)
      .eq('clase_id', claseId);
    if (error) throw error;
  }

  // ─── ASISTENCIAS ──────────────────────────────────────────────────────────────

  async getAsistencias() {
    const { data, error } = await this.supabase
      .from('asistencias')
      .select('*')
      .order('fecha', { ascending: false });
    if (error) throw error;
    return data;
  }

  async crearAsistencia(asistencia: {
    persona_id: number;
    nombre: string;
    motivo: string;
  }) {
    const { data, error } = await this.supabase
      .from('asistencias')
      .insert(asistencia)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
