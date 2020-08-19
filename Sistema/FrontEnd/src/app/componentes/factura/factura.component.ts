import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { DataApiService } from '../../services/data-api.service';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Location } from '@angular/common';
import { facturaInterface } from '../../modelos/factura-interface';
import { Router } from '@angular/router';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faFileDownload } from '@fortawesome/free-solid-svg-icons';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { element } from 'protractor';
import { UserOptions } from 'jspdf-autotable';
import Swal from 'sweetalert2';

// tslint:disable-next-line: class-name
interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

declare var $: any;
@Component({
  selector: 'app-factura',
  templateUrl: './factura.component.html',
  styleUrls: ['./factura.component.css']
})
export class FacturaComponent implements OnInit {
  @ViewChild('factura') factura: ElementRef;

  value = 'Clear me';
  constructor(public dataApiService: DataApiService, public authService: AuthService, public router: Router) { }
  facturas;
  facturasProc;
  busquedaNumero = '';
  encabezadoF;
  detalleF;
  numExiste = [];
  email;
  nombre;
  idSeleccionada;
  faEye = faEye;
  faCheck = faCheck;
  faTimes = faTimes;
  faFileDownload = faFileDownload;
  faPaperPlane = faPaperPlane;
  total;
  archivoSeleccionado;
  btnFactura = true;
  paginaActual = 1;
  ngOnInit() {
    this.listaFacturas();
  }

  listaFacturas(): void {
    this.dataApiService.listaFactura().subscribe((facturas) => (this.facturas = facturas));
    this.dataApiService.listaFacturaProcesado().subscribe((facturasProc) => (this.facturasProc = facturasProc));
  }

  obtieneDatosCompletos(idFactura) {
    this.dataApiService.obtieneFactura(idFactura).subscribe((encabezadoF) => (this.encabezadoF = encabezadoF));
    this.dataApiService.detalleFacturaCompleta(idFactura).subscribe((detalleF) => (this.detalleF = detalleF));
  }

  generaPDF(idFactura) {
    this.obtieneDatosCompletos(idFactura);
    setTimeout(() => {


    let enca = '';
    let ci = '';
    let tel = '';
    let dir = '';
    const det = [];
    let stl = '';
    let iva = '';
    const tabla = ['Cant', 'Detalle', 'P. Unit', 'P. Tot'];

    for (const item of this.encabezadoF) {
      if (item.idFactura === idFactura) {
        this.idSeleccionada = item.idFactura;
        enca = item.numeropedido.toString();
        this.nombre = item.nombre.toString();
        ci = item.identificacion.toString();
        tel = item.telefono.toString();
        dir = item.direccion.toString();
        this.email = item.email.toString();
        stl = item.subtotal.toString();
        iva = item.iva.toString();
        this.total = item.total.toString();
      }
    }
    for (const item of this.detalleF) {
      if (item.idfactura === idFactura) {
        det.push([item.cantidad, item.producto, item.preciounitario, item.preciototal]);
      }
    }
    const doc = new jsPDF('p', 'mm', 'letter') as jsPDFWithPlugin;
    const logo = new Image();
    logo.src = '../../../assets/LogoPestaña.png';
    doc.setFontSize(20);
    doc.setFontStyle('Latin');
    doc.setFontType('bold');
    doc.text('CEVICHERIA PUERTO DE MANTA', 45, 30);
    doc.addImage(logo, 'PNG', 15, 15, 25, 25);
    doc.setFontSize(16);
    doc.setFontStyle('Latin');
    doc.setFontType('bold');
    doc.text('Orden de Pedido N°: ' + enca, 130, 65);
    doc.setFontSize(12);
    doc.setFontStyle('Latin');
    doc.text('Cliente: ' + this.nombre, 25, 80);
    doc.text('Cédula: ' + ci, 140, 80);
    doc.text('Telefono: ' + tel, 25, 87);
    doc.text('E-mail: ' + this.email, 140, 87);
    doc.text('Dirección: ' + dir, 25, 94);
    doc.line(20, 101, 195, 101);
    doc.setFontType('bold');
    doc.setFontSize(13);
    doc.text('Detalle de la compra', 25, 109);

    doc.autoTable({
      margin: {
        top: 119,
        left: 20,
        right: 20
      },
      footStyles: { fontStyle: 'bold', fontSize: 12, textColor: [0, 0, 0], fillColor: [255, 255, 255] },
      head: [tabla],
      body: det,
      foot: [
        ['', '', '', ''],
        ['', '', 'Subtotal', '$ ' + stl],
        ['', '', 'IVA 12%', '$ ' + iva],
        ['', '', 'TOTAL', '$ ' + this.total]
      ]
    });

    doc.line(100, 149, 195, 149);
    doc.setFontSize(9);
    doc.text('* Este documento no tiene validez tributario', 140, 270);
    this.archivoSeleccionado = `Orden de pedido - ${enca}.pdf`;
    doc.save(this.archivoSeleccionado);
    this.btnFactura = false;
  }, 600);
  }
 
  enviaFactura(idFactura) {
    if (this.idSeleccionada !== idFactura) {
      Swal.fire({
        title: `No puede enviar la Orden de pedido del Sr(a). ${this.nombre.toString()} a otro cliente`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
    } else {
      const correo = this.email;
      const asunto = 'Compra en Cevichería Puerto de Manta';
      const mensaje = `Valor a pagar: $ ${this.total.toString()}`;
      this.dataApiService.enviaCorreo(correo, asunto, mensaje, this.archivoSeleccionado).subscribe();
      this.btnFactura = true;
      this.archivoSeleccionado = null;
      this.dataApiService.soloEstado(idFactura).subscribe(factura => this.listaFacturas());
      Swal.fire({
        icon: 'success',
        title: 'Orden de pedido enviada al correo del cliente',
        showConfirmButton: false,
        timer: 2500
      });
    }
  }

}
