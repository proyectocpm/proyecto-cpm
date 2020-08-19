import { Component, OnInit } from '@angular/core';
import { DataApiService } from 'src/app/services/data-api.service';
import { ActivatedRoute } from '@angular/router';
import { ProductoInterface } from 'src/app/modelos/producto-interface';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { faRedoAlt } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.component.html',
  styleUrls: ['./producto.component.css']
})
export class ProductoComponent implements OnInit {

  constructor(public dataApiService: DataApiService) { }
  public productos;
  value = 'Clear me';
  busquedaNombre = '';
  faPlus = faPlus;
  faTrashAlt = faTrashAlt;
  faRedoAlt = faRedoAlt;
  faEdit = faEdit;
  paginaActual: number = 1;
  ngOnInit() {
    this.listaProducto();
  }
  listaProducto(): void {
    this.dataApiService.obtieneTodosProductos()
      .subscribe((productos) => (this.productos = productos));
  }
  eliminarProducto(id: string): void {
    if (confirm('¿Seguro desea eliminarlo ?')) {
      this.dataApiService.eliminarproducto(id).subscribe(producto => this.listaProducto());
    }
  }

  actualizaProducto(producto: ProductoInterface): void {
    this.dataApiService.seleccionarproducto = Object.assign({}, producto);
  }

  reseteoForm(productoForm?: NgForm): void {
    this.dataApiService.seleccionarproducto = {
      id: null,
      nombre: '',
      precio: '',
      descripcion: 'No especificado',
      urlImagen: '',
      stock: '',
      idcategoria: ''
    };
  }
}
