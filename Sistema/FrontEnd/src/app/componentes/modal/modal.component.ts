import { ProductoComponent } from './../producto/producto.component';
import { Component, OnInit } from '@angular/core';
import { DataApiService } from '../../services/data-api.service';
import { NgForm } from '@angular/forms';

import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { Location } from '@angular/common';
import { categoriaInterface } from '../../modelos/categoria-interface';
declare var $: any;

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {

  constructor(public dataApiService: DataApiService, public location: Location, public productoComponent: ProductoComponent) { }
  comprueba = [];
  productos;
  categoria: categoriaInterface = {
    id: null,
    nombreCategoria: '',
    descripcionCategoria: '',
    urlImagen: ''
  };
  faTrashAlt = faTrashAlt;
  faSave = faSave;
  faPlus = faPlus;
  categorias;
  public error = false;
  ngOnInit() {
    this.listaCategoria();
  }
  guardarProducto(productoForm: NgForm): void {
    if (productoForm.value.productoId == null) {
      if (productoForm.valid) {
        this.dataApiService.guardarproducto(productoForm.value).subscribe(productos => this.productoComponent.listaProducto()
          , error => this.muestraError());
        $('#modalproducto').modal('hide');
      } else {
        this.muestraError();
      }
    } else {
      if (productoForm.valid) {
        this.dataApiService.actualizarproducto(productoForm.value).subscribe(producto => this.productoComponent.listaProducto()
          , error => this.muestraError());
        $('#modalproducto').modal('hide');
      } else {
        this.muestraError();
      }
    }
  }
  listaCategoria(): void {
    this.dataApiService.listaCategoria().subscribe((categorias) => this.categorias = categorias);
    this.dataApiService.obtieneTodosProductos().subscribe((productos) => this.productos = productos);
  }
  guardaCategoria(categoriaForm: NgForm): void {
    if (categoriaForm.valid) {
      this.dataApiService.guardaCategoria(categoriaForm.value).subscribe(categoria => this.listaCategoria(), error => this.muestraError());
      $('#modalproducto').modal('show');
      $('#categoria').modal('hide');
    } else {
      this.muestraError();
    }
  }
  eliminaCategoria(id): void {
    for (const item of this.productos) {
      this.comprueba.push(item.idcategoria);
    }
    if (this.comprueba.includes(id)) {
      if (confirm('Otros productos estan vinculados a esta categoria. ¿Desea eliminarla?')) {
        this.dataApiService.eliminaCategoria(id).subscribe(categoria => this.listaCategoria());
      }
    } else { this.dataApiService.eliminaCategoria(id).subscribe(categoria => this.listaCategoria()); }
  }
  ocultaMproducto(): void {
    $('#modalproducto').modal('hide');
  }
  cierraMcategoria(): void {
    $('#modalproducto').modal('show');
    $('#categoria').modal('hide');
  }
  reseteoForm(categoriaForm?: NgForm): void {
    this.categoria = {
      id: null,
      nombreCategoria: '',
      descripcionCategoria: '',
      urlImagen: ''
    };
  }
  muestraError(): void {
    this.error = true;
    setTimeout(() => {
      this.error = false;
    }, 3000);
  }
}

