import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dudas',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dudas.html',
  styleUrl: './dudas.css'
})
export class DudasComponent {
  pasoActivo: number | null = null;

  pasos = [
    {
      numero: 1,
      titulo: 'Regístrate',
      descripcion: 'Antes de inscribirte a cualquier clase necesitas crear tu perfil. Solo toma un par de minutos. Necesitarás tu nombre completo, número de teléfono, fecha de nacimiento y tu estaca y barrio.',
      accion: 'Ir a registro',
      ruta: '/registro'
    },
    {
      numero: 2,
      titulo: 'Elige una clase',
      descripcion: 'Una vez registrado, entra al catálogo de clases y selecciona la que más te interese. Puedes ver el instructor, horario, días y cupo disponible antes de inscribirte.',
      accion: 'Ver clases',
      ruta: '/clases-publico'
    },
    {
      numero: 3,
      titulo: 'Inscríbete',
      descripcion: 'Dentro de la clase que elegiste, busca tu nombre en el buscador y confirma tu inscripción. Tu lugar quedará apartado de inmediato.',
      accion: 'Ver clases',
      ruta: '/clases-publico'
    }
  ];

  togglePaso(num: number): void {
    this.pasoActivo = this.pasoActivo === num ? null : num;
  }
}