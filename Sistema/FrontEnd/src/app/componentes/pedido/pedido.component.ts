import { Component, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { DataApiService } from '../../services/data-api.service';
import { PedidoInterface } from '../../modelos/pedido-interface';
import { detallePedidoInterface } from '../../modelos/detallePedido-interface';

import { faEye } from '@fortawesome/free-solid-svg-icons';
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { detalleFacturaInterface } from 'src/app/modelos/detalleFactura-interface';
import Swal from 'sweetalert2';
import { facturaInterface } from '../../modelos/factura-interface';
import { AuthService } from '../../services/auth.service';
declare var $: any;

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css'],
})
export class PedidoComponent implements OnInit {

  constructor(public dataApiService: DataApiService, public auth: AuthService, public router: Router) { }
  pedidos;
  pedidosHis;
  detallePedido;
  faEye = faEye;
  faTimes = faTimes;
  faCheck = faCheck;
  faFileInvoiceDollar = faFileInvoiceDollar;
  pedidoSeleccionado = 0;
  precioT = 0.00;
  iva;
  subtotal;
  estado;
  idpago;
  numero = 0;
  facturas;
  item;
  contacto = [{}];
  contactoH = [{}];
  paginaActual = 1;
  usuarios;
  ngOnInit() {
    this.listaPedido();
  }

  listaPedido(): void {
    this.dataApiService.obtienePedido().subscribe((pedidos) => (this.pedidos = pedidos));
    this.dataApiService.obtienePedidoHis().subscribe((pedidosHis) => (this.pedidosHis = pedidosHis));
    this.auth.listaTodoUsuario().subscribe((usuarios) => (this.usuarios = usuarios));
  }

  obtieneDetalle(numeroPedido: number): void {
    this.contacto = [{}];
    this.dataApiService.obtieneDetallePedido(numeroPedido).subscribe((detallePedido) => (this.detallePedido = detallePedido));
    for (const item of this.pedidos) {
      if (item.numeropedido === numeroPedido) {
        this.contacto = [item];
      }
    }
    for (const item of this.pedidosHis) {
      if (item.numeropedido === numeroPedido) {
        this.contactoH = [item];
      }
    }
    this.pedidoSeleccionado = numeroPedido;
  }

  insertaDetalle() {
    this.precioT = 0;
    this.iva = 0;
    this.subtotal = 0;
    this.idpago = 0;
    let ordenPedido = {};
    for (const item of this.detallePedido) {
      if (item.numeropedido === this.pedidoSeleccionado) {
        this.precioT = this.precioT + item.preciototal;
      }
    }
    this.dataApiService.guardaDetalleFactura(this.detallePedido).subscribe(detalleF => this.router.navigate(['/pedido']));
    this.iva = parseFloat((Math.round((this.precioT * 0.12) * 100) / 100).toString()).toFixed(2);
    this.subtotal = parseFloat((Math.round((this.precioT - this.iva) * 100) / 100).toString()).toFixed(2);
    this.estado = 'Pendiente';
    this.idpago = 1;
    // tslint:disable-next-line: max-line-length
    ordenPedido = {subtotal: this.subtotal, iva: this.iva, total: this.precioT, estado: this.estado, idpago: this.idpago, numero: this.pedidoSeleccionado};
    this.dataApiService.guardaFactura(ordenPedido).subscribe();
    setTimeout(() => {
      this.dataApiService.actualizaDetalleF(this.pedidoSeleccionado).subscribe();
    }, 2000);
    this.dataApiService.actualizaEstadoPedido(this.pedidoSeleccionado).subscribe(factura => this.cargaListaFacturas());
    this.cambioRuta();
  }

  cancelaPedido(numeropedido: number) {
    this.dataApiService.cancelaPedido(numeropedido).subscribe();
    this.dataApiService.estadoInicial(numeropedido).subscribe();
    this.precioT = 0;
  }

  cargaListaFacturas(): void {
    this.dataApiService.listaFactura().subscribe((facturas) => (this.facturas = facturas));
  }

  mostrarModal() {
    $('#modalDetallePedido').modal('show');
  }

  cambioRuta() {
    Swal.fire({
      title: 'Procesado!',
      text: 'Pedido procesado con éxito',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    }).then((result) => {
      this.cargaListaFacturas();
      $('#modalDetallePedido').modal('hide');
      this.router.navigate(['/orden_pedido']);
    });
  }
}
