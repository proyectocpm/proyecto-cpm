import { Component } from '@angular/core';
import { DataApiService } from '../servicios/data-api.service';
import { AlertController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ComplementoPage } from './complemento/complemento.page';

@Component({
  selector: 'app-carrito',
  templateUrl: 'carrito.page.html',
  styleUrls: ['carrito.page.scss']
})
export class CarritoPage {

  constructor(private dataApi: DataApiService, private alertController: AlertController, private router: Router,
              private modalCtrl: ModalController) { }
  detallePedido;
  totalCompra = 0.00;
  totalPagar = 0.00;
  ionViewWillEnter() {
    this.detallePedido = this.dataApi.obtienePedido();
    this.totales();
  }
  totales() {
    this.totalCompra = 0.00;
    this.totalPagar = 0.00;
    for (const item of this.detallePedido) {
      this.totalCompra = this.totalCompra + item.precioT;
    }
    this.totalPagar = 1.50 + this.totalCompra;
  }
  async modal() {
    const modal = await this.modalCtrl.create({
      component: ComplementoPage,
      componentProps: {
        total: this.totalPagar
      }
    });
    await modal.present();
  }

  async direccionEnvio() {
    const alert = await this.alertController.create({
      header: '!! Recuerda ver el mapa ¡¡',
      subHeader: 'Las entregas solo se las realiza en el sector norte marcado en el mapa',
      message: `<img src="../../assets/mapa.png" >`,
      buttons: [
        {
          text: 'Ir al mapa',
          cssClass: 'secondary',
          handler: () => {
            this.router.navigate(['menu/mapa']);
          }
        },
        {
          text: 'Continuar',
          handler: () => {
            this.modal();
          }
        }
      ]
    });

    await alert.present();
  }
}
