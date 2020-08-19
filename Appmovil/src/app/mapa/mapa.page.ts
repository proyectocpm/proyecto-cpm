import { Component } from '@angular/core';
import { GoogleMap, GoogleMaps, GoogleMapsEvent, GoogleMapOptions, CameraPosition, MarkerOptions, Marker } from '@ionic-native/google-maps';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { LoadingController, AlertController } from '@ionic/angular';
import { DataApiService } from '../servicios/data-api.service';
import { Router } from '@angular/router';

declare var google;

@Component({
  selector: 'app-mapa',
  templateUrl: 'mapa.page.html',
  styleUrls: ['mapa.page.scss']
})
export class MapaPage {

  constructor(private googleMaps: GoogleMaps, public geolocation: Geolocation, private loadingCtrl: LoadingController,
              private dataApi: DataApiService, private router: Router, private alertController: AlertController) {}
  finaliza = false;
  contadorProducto;

  mapa: GoogleMap;
  mapRef = null;

  area = [
    // { lat: -0.199082, lng: -78.498032 },
    { lat: -0.212759, lng: -78.488735 },
    { lat: -0.204480, lng: -78.481146 },

    { lat: -0.191343, lng: -78.480824 },
    { lat: -0.151947, lng: -78.464435 },
    { lat: -0.153639, lng: -78.489453 },
    { lat: -0.167861, lng: -78.486777 },
    { lat: -0.174197, lng: -78.493390 },
    { lat: -0.186472, lng: -78.495949 },
    { lat: -0.185839, lng: -78.497376 },
    { lat: -0.194348, lng: -78.501593 },
    { lat: -0.197933, lng: -78.502369 },
    { lat: -0.198956, lng: -78.500672 },
    { lat: -0.205705, lng: -78.502524 },
    { lat: -0.208686, lng: -78.495632 },
    { lat: -0.212756, lng: -78.491891 }
  ];

  /*ngOnInit() {

  }*/
   ionViewWillEnter() {
    this.cargarMapa();
    this.cantidad();
    this.direccionEnvio();
  }
  async cargarMapa() {
    const loading = await this.loadingCtrl.create();
    loading.present();
    const myLatLng = await this.getLocation();
    const mapEle: HTMLElement = document.getElementById('map');
    this.mapRef = new google.maps.Map(mapEle, {
      center: myLatLng,
      zoom: 12,
    }
    );
    google.maps.event
      .addListenerOnce(this.mapRef, 'idle', () => {
        loading.dismiss();
        this.addMaker(myLatLng.lat, myLatLng.lng);
      });
    const areaMap = new google.maps.Polygon({
      paths: this.area,
      strokeColor: '# FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '# FF0000',
      fillOpacity: 0.35
    });
    areaMap.setMap(this.mapRef);
  }
  async getLocation() {
    const rta = await this.geolocation.getCurrentPosition();
    return {
      lat: rta.coords.latitude,
      lng: rta.coords.longitude
    };
  }
  private addMaker(lat: number, lng: number) {
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.mapRef,
      title: 'Hola !',
      icon: '../../assets/marker.png'
    });
  }
  cantidad() {
    this.contadorProducto = this.dataApi.obtieneCantidad();
    if (this.dataApi.contadorProductos === 0) {
      this.finaliza = false;
    } else {
      this.finaliza = true;
    }
  }
  finCompra() {
    this.router.navigate(['menu/carrito']);
  }

  async direccionEnvio() {
    const alert = await this.alertController.create({
      header: '    !! Recuerda ¡¡',
      subHeader: 'Nuestro servicio de entrega solo es en el sector norte de la ciudad que está delimitado en el mapa',
      message: `<img src="../../assets/alertMap.png" >`,
      buttons: [
        {
          text: 'Aceptar',
          cssClass: 'secondary'
        }
      ]
    });

    await alert.present();
  }
}
