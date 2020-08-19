import { Component, OnInit, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { AuthserviceService } from '../../servicios/authservice.service';
import { ClienteInterface } from '../../Modelos/cliente-interface';
import { DataApiService } from '../../servicios/data-api.service';
import { NgForm } from '@angular/forms';
import { DireccionEnvioInterface } from '../../Modelos/direecionEnvio-interface';
import { Router } from '@angular/router';
import { isNullOrUndefined } from 'util';

@Component({
  selector: 'app-complemento',
  templateUrl: './complemento.page.html',
  styleUrls: ['./complemento.page.scss'],
})
export class ComplementoPage implements OnInit {

  @Input() total;
  numeropedido;
  pedidos;
  cliente: ClienteInterface;
  error;
  id;
  pedido;
  datosCliente;
  private direccionEnvio: DireccionEnvioInterface = {
    id: 0,
    callePrincipal: '',
    calleSecundaria: '',
    numero: '',
    referencia: ''
  };
  constructor(private modalCtrl: ModalController, private authService: AuthserviceService,
              private dataApi: DataApiService, private router: Router, private alertController: AlertController) { }

  ngOnInit() {
    this.cliente = this.authService.getCurrentCliente();
    this.dataApi.pedidos().subscribe((pedidos) => (this.pedidos = pedidos));
    this.authService.clientePorId().subscribe((datosCliente) => {
      (this.datosCliente = datosCliente);
      if (this.datosCliente.direccion === null || this.datosCliente.direccion === '') {
        this.cliente.direccion = 'Ingrese una dirección corta';
      } else {
        this.cliente.direccion = this.datosCliente.direccion;
      }
      if (this.datosCliente.identificacion === null || this.datosCliente.identificacion === '') {
        this.cliente.identificacion = 'Número de cédula';
      } else {
        this.cliente.identificacion = this.datosCliente.identificacion;
      }
      if (this.datosCliente.telefono === null || this.datosCliente.telefono === '') {
        this.cliente.telefono = 'Número de telefono';
      } else {
        this.cliente.telefono = this.datosCliente.telefono;
      }
    }
    );

  }

  creaNumeroPedido() {
    for (const item of this.pedidos) {
      this.numeropedido = item.numeropedido;
    }
    if (isNullOrUndefined(this.numeropedido) ) {
      this.numeropedido = 1;
    } else {
      this.numeropedido = this.numeropedido + 1;
    }
    this.dataApi.actualizaNumPedido(this.numeropedido);
  }
  guardaDireccionEnvio(direccionEnvioForm: NgForm) {
    if (direccionEnvioForm.valid) {
      this.dataApi.guardaDireccion(direccionEnvioForm.value).subscribe();
      this.actualizaDireccion();
      this.guardaPedido();
      this.envíaNotificacion();
    } else {
      this.muestraError();
    }
  }
  actualizaDireccion() {
    this.id = this.authService.getCurrentCliente().id;
    this.authService.datosFactura(this.cliente).subscribe();
  }
  guardaPedido() {
    this.pedido = this.dataApi.obtienePedido();
    this.dataApi.guardaPedido(this.pedido).subscribe(
      res => {
        this.mensajeFin();
        this.dataApi.contadorProductos = 0;
        this.dataApi.enceraArray();
        this.router.navigate(['menu/categoria'])
      });
  }
  muestraError(): void {
    this.error = true;
    setTimeout(() => {
      this.error = false;
    }, 3000);
  }
  async mensajeFin() {
    const alert = await this.alertController.create({
      header: '!! HECHO ¡¡',
      subHeader: 'Pedido enviado',
      message: `<img src="../../assets/check3.png">`,
      backdropDismiss: false,
      cssClass: 'imagen',
      buttons: [
        {
          text: 'Aceptar',
          cssClass: 'secondary ',
          handler: () => {
            this.cierraModal();
          }
        }
      ]
    });

    await alert.present();
  }
  cierraModal() {
    this.modalCtrl.dismiss();
  }
  envíaNotificacion() {
    this.dataApi.notificacion().subscribe();
  }
}
