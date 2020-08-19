import { CategoriaInterface } from './../Modelos/categoria-interface';
import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AuthserviceService } from './authservice.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PedidoInterface } from '../Modelos/pedido-interface';
import { DireccionEnvioInterface } from '../Modelos/direecionEnvio-interface';


@Injectable({
  providedIn: 'root'
})
export class DataApiService {
  public contadorProductos = 0;
  private pedido: PedidoInterface[] = [{
    numeropedido: 0,
    estado: 'Pendiente',
    cantidad: 0,
    nombre: '',
    precio: 0,
    precioT: 0,
    idproducto: 0,
    idcliente: 0
  }];
  constructor(private http: HttpClient, private authService: AuthserviceService) { }
  headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
  });
  categoria: Observable<CategoriaInterface>;

  obtieneCategoria() {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/categoria?access_token=${token}`;
    return this.http.get(urlApi);
  }
  categoriPorId(id) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/categoria/${id}&access_token=${token}`;
    return this.http.get(urlApi);
  }
  productoPorCategoria(idcategoria) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/categoria/productoPorCategoria?idcategoria=${idcategoria}&access_token=${token}`;
    return this.http.get(urlApi);
  }

  // ______________________________PEDIDO _________________________
  pedidos() {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/pedidos?access_token=${token}`;
    return this.http.get(urlApi);
  }

  /////// ____________PEDIDOS LOCAL _______________
  cantidad(cantidad) {
    this.contadorProductos = cantidad;
  }
  obtieneCantidad() {
    return this.contadorProductos;
  }
  obtienePedido() {
    return this.pedido.filter(pedido => {
      return pedido.idproducto !== 0;
    });
  }
  añadeProducto(numeropedido: number, cantidad: number, nombre: string, precio: number, precioT: number,
    idproducto: number, idcliente: number) {
    this.pedido.push({
      numeropedido,
      estado: 'Pendiente',
      cantidad,
      nombre,
      precio,
      precioT,
      idproducto,
      idcliente
    });
  }
  eliminaProducto(idproducto: number) {
    this.pedido = this.pedido.filter(pedido => {
      return pedido.idproducto !== idproducto && pedido.idproducto !== 0;
    });
  }
  actualizaCantidad(idproducto: number, cantidad: number, precioT) {
    let alterno;
    alterno = this.pedido.find(pedido =>
      pedido.idproducto === idproducto
    );
 
    alterno.cantidad = cantidad;
    precioT = alterno.cantidad * alterno.precio;
    alterno.precioT = precioT;
    return this.pedido;
  }
  actualizaNumPedido(numeropedido) {
    for (const item of this.pedido) {
      item.numeropedido = numeropedido;
    }
    return this.pedido;
  }
  enceraArray() {
    this.pedido = this.pedido.filter(pedido => {
      return pedido.idproducto === 0;
    });
  }

// --------- GUARDA DIRECCION ENVIO
  guardaDireccion(direccionE: DireccionEnvioInterface) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/direccionClientes?access_token=${token}`;
    return this.http.post<DireccionEnvioInterface>(urlApi , direccionE, {headers: this.headers} )
          .pipe(map(data => data));
  }

// --------- GUARDA EN TABLA PEDIDO
  guardaPedido(pedido: PedidoInterface) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/pedidos?access_token=${token}`;
    return this.http.post<PedidoInterface>(urlApi, pedido, {headers: this.headers})
          .pipe(map(data => data));
  }
    // ------- NOTIFICACION -----
  notificacion() {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/pedidos/notificacion?access_token=${token}`;
    return this.http.get(urlApi);
  }
}
