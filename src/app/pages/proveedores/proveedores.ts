import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.css'
})
export class ProveedoresComponent implements OnInit {
  busqueda = '';
  filtroCategoria = 'todas';
  proveedores: any[] = [];

  categorias = [
    'todas',
    'Alimentos y bebidas',
    'Carnes y mariscos',
    'Frutas y verduras',
    'Vinos y licores',
    'Utensilios y equipo',
    'Limpieza e higiene',
    'Uniformes y textiles',
    'Tecnología y sistemas',
    'Otro'
  ];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.proveedores = JSON.parse(localStorage.getItem('proveedores') || '[]');
  }

  get proveedoresFiltrados() {
    return this.proveedores.filter(p => {
      const matchCategoria = this.filtroCategoria === 'todas' || p.categoria === this.filtroCategoria;
      const matchBusqueda = p.empresa?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
                            p.contacto?.toLowerCase().includes(this.busqueda.toLowerCase());
      return matchCategoria && matchBusqueda;
    });
  }

  cambiarEstado(proveedor: any, estado: string) {
    proveedor.estado = estado;
    localStorage.setItem('proveedores', JSON.stringify(this.proveedores));
  }

  eliminar(id: number) {
    this.proveedores = this.proveedores.filter(p => p.id !== id);
    localStorage.setItem('proveedores', JSON.stringify(this.proveedores));
  }

  get totalActivos() { return this.proveedores.filter(p => p.estado === 'activo').length; }
  get totalPendientes() { return this.proveedores.filter(p => p.estado === 'pendiente').length; }
}