import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class RegistroComponent {
  paso = 1;
  enviado = false;
  cargando = false;
  telefonoDuplicado = false;
  errorGeneral = '';

  registro = {
    nombre: '',
    apellidos: '',
    telefono: '',
    fechaNacimiento: '',
    esMiembro: null as boolean | null,
    estaca: '',
    barrio: ''
  };

  estacas = ['Los Angeles', 'Libertad', 'Moderna', 'Andalucia', 'Otra'];

  barrios: Record<string, string[]> = {
    'Los Angeles': ['La Silla', 'Monte Cristal', 'Tres Caminos', 'Nueva Aurora', 'Quince de Mayo', 'Valle Hermoso', 'Zaragoza'],
    'Libertad':    ['Bosques de San Miguel', 'Lomas de Pedregal', 'Los Puertos', 'Pedregal', 'San Miguel', 'San Rafael', 'Victoria'],
    'Moderna':     ['Fundidora', 'Casa Blanca', 'Estancia', 'Linda Vista', 'Nogalar'],
    'Andalucia':   ['Juarez 1', 'Juarez 2', 'Tamaulipas', 'China', 'Las Espigas', 'Cadereyta'],
    'Otra':          ['General']
  };

  barriosDisponibles: string[] = [];

  constructor(private supa: SupabaseService) {}

  get fechaMaxima(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  }

  onEstacaChange(): void {
    this.registro.barrio = '';
    this.barriosDisponibles = this.barrios[this.registro.estaca] ?? [];
  }

  async verificarTelefono(): Promise<void> {
    if (!this.registro.telefono) return;
    try {
      const existe = await this.supa.buscarPorTelefono(this.registro.telefono);
      this.telefonoDuplicado = !!existe;
    } catch {
      this.telefonoDuplicado = false;
    }
  }

  siguientePaso(): void {
    if (this.paso < 3) this.paso++;
  }

  anteriorPaso(): void {
    if (this.paso > 1) this.paso--;
  }

  async enviar(): Promise<void> {
    if (this.cargando) return;
    this.cargando = true;
    this.errorGeneral = '';
    try {
      await this.supa.crearRegistro({
  nombre:     this.registro.nombre,
  apellidos:  this.registro.apellidos,
  telefono:   this.registro.telefono,
  es_miembro: this.registro.esMiembro ?? false,
  estaca:     this.registro.estaca,
  barrio:     this.registro.barrio
});
      this.enviado = true;
    } catch (err: any) {
      this.errorGeneral = 'Ocurrió un error al guardar. Intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }
}
