import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ProductoInterface } from 'src/app/modelos/producto-interface';
import { EmailInterface } from '../modelos/email-interface';
import { detallePedidoInterface } from '../modelos/detallePedido-interface';
import { detalleFacturaInterface } from '../modelos/detalleFactura-interface';
import { facturaInterface } from '../modelos/factura-interface';
import { PedidoInterface } from '../modelos/pedido-interface';
import { facturaCompletaInterface } from '../modelos/facturaCompleta-interface';
import { categoriaInterface } from '../modelos/categoria-interface';

@Injectable({
  providedIn: 'root'
})
export class DataApiService {

  constructor(private http: HttpClient, private authService: AuthService) { }

  productos: Observable<any>;
  producto: Observable<any>;
  pedido: Observable<any>;
  detalleFactura: Observable<any>;
  factura: Observable<any>;
  public seleccionarproducto: ProductoInterface = {
    id: null,
    nombre: '',
    precio: '',
    descripcion: '',
    urlImagen: '',
    stock: '',
    categoria: ''
  };
  headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    Authorization: this.authService.getToken()
  });
  obtieneTodosProductos() {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/productos/obtieneProductos?access_token=${token}`;
    return this.http.get(urlApi, { headers: this.headers })
    .pipe(map(data => data));
  }

  eliminarproducto(id: string) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/productos/${id}/?access_token=${token}`;
    return this.http
      .delete<ProductoInterface>(urlApi, { headers: this.headers })
      .pipe(map(data => data));
  }
  guardarproducto(producto: ProductoInterface) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/productos?access_token=${token}`;
    return this.http
      .post<ProductoInterface>(urlApi, producto, { headers: this.headers })
      .pipe(map(data => data));
  }
  actualizarproducto(producto) {
    const productoId = producto.productoId;
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/productos/${productoId}/?access_token=${token}`;
    return this.http
      .put<ProductoInterface>(urlApi, producto, { headers: this.headers })
      .pipe(map(data => data));
  }
/* _______________ CATEGORIA ____________________________-
__________________________________________________________*/
listaCategoria() {
  const token = this.authService.getToken();
  const urlApi = `https://cpm-api.herokuapp.com/api/categoria?access_token=${token}`;
  return this.http.get(urlApi);
}
guardaCategoria(categoria) {
  const token = this.authService.getToken();
  const urlApi = `https://cpm-api.herokuapp.com/api/categoria?access_token=${token}`;
  return this.http
    .post<categoriaInterface>(urlApi, categoria, { headers: this.headers })
    .pipe(map(data => data));
}
eliminaCategoria(id) {
  const token = this.authService.getToken();
  const urlApi = `https://cpm-api.herokuapp.com/api/categoria/${id}/?access_token=${token}`;
  return this.http
    .delete<categoriaInterface>(urlApi, { headers: this.headers })
    .pipe(map(data => data));
}
// ____________________________-
//   ENVIO DE CORREO
  enviaCorreo(email: string, asunto: string, mensaje: string, archivo: string) {
    const token = this.authService.getToken();
    // tslint:disable-next-line: max-line-length
    const urlApi = `https://cpm-api.herokuapp.com/api/pagos/enviarEmail?direccionEmail=${email}&asunto=${asunto}&mensaje=${mensaje}&archivo=${archivo}&access_token=${token}`;
    return this.http.get(urlApi, {headers: this.headers}).pipe(map(data => data));
  }
  // --- PEDIDOS  ----
  obtienePedido() {
    const urlApi = `https://cpm-api.herokuapp.com/api/pedidos/conteoPedido`;
    return this.http.get(urlApi);
  }
  obtieneDetallePedido(numeroPedido: number) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/pedidos/detallePedidoPorId?numeropedido=${numeroPedido}&access_token=${token}`;
    return this.http.get<detallePedidoInterface>(urlApi, { headers: this.headers })
    .pipe(map(data => data));
  }
  actualizaEstadoPedido(numeropedido) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/pedidos/actualizaEstado?numeropedido=${numeropedido}&access_token=${token}`;
    return this.http
      .put<PedidoInterface>(urlApi, numeropedido, { headers: this.headers })
      .pipe(map(data => data));
  }
// Historial
obtienePedidoHis() {
  const urlApi = `https://cpm-api.herokuapp.com/api/pedidos/conteoPedidoHis`;
  return this.http.get(urlApi, { headers: this.headers })
  .pipe(map(data => data));
}
itemEnviado(productoEnviado, id) {
  const token = this.authService.getToken();
  const urlApi = `https://cpm-api.herokuapp.com/api/pedidos/itemEnviado?productoEnviado=${productoEnviado}&id=${id}&access_token=${token}`;
  return this.http
    .put<PedidoInterface>(urlApi, productoEnviado, id);
}
estadoInicial(numeropedido) {
  const token = this.authService.getToken();
  const urlApi = `https://cpm-api.herokuapp.com/api/pedidos/estadoInicial?numeropedido=${numeropedido}&access_token=${token}`;
  return this.http
    .put<PedidoInterface>(urlApi, numeropedido, { headers: this.headers })
    .pipe(map(data => data));
}

  /*----_ DETALLE FACTURA _-----------------
  --------------------------------------- */
  guardaDetalleFactura(detalleFactura: detalleFacturaInterface) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/detallefacturas?access_token=${token}`;
    return this.http
      .post<detalleFacturaInterface>(urlApi, detalleFactura, { headers: this.headers })
      .pipe(map(data => data));
  }
  eliminarDetalle(id) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/detallefacturas/eliminaPorIdPedido?idpedido=${id}&access_token=${token}`;
    return this.http
      .delete<detalleFacturaInterface>(urlApi, { headers: this.headers })
      .pipe(map(data => data));
  }
  cancelaPedido(id) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/detallefacturas/eliminaCancelaPedido?numeropedido=${id}&access_token=${token}`;
    return this.http
      .delete<detalleFacturaInterface>(urlApi, { headers: this.headers })
      .pipe(map(data => data));
  }
  actualizaDetalleF(numeropedido) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/detallefacturas/actualizaId?numeropedido=${numeropedido}&access_token=${token}`;
    return this.http
      .put<detalleFacturaInterface>(urlApi, numeropedido, { headers: this.headers })
      .pipe(map(data => data));
  }

  /*___  FACTURA ______
  _____________________*/
  guardaFactura(factura: facturaInterface) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/facturas?access_token=${token}`;
    return this.http
      .post<facturaInterface>(urlApi, factura, { headers: this.headers })
      .pipe(map(data => data));
  }
  listaFactura() {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/facturas/facturaCliente?access_token=${token}`;
    return this.http.get(urlApi, { headers: this.headers })
    .pipe(map(data => data));
  }
  obtieneFactura(idFactura) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/facturas/clienteFacturaId?idfactura=${idFactura}&access_token=${token}`;
    return this.http.get<facturaCompletaInterface>(urlApi, { headers: this.headers})
    .pipe(map(data => data));
  }
  detalleFacturaCompleta(idFactura) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/facturas/detFacPorIdFactura?idfactura=${idFactura}&access_token=${token}`;
    return this.http.get<facturaCompletaInterface>(urlApi, { headers: this.headers})
    .pipe(map(data => data));
  }
  actualizaNumero(numero, idfactura) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/facturas/actualizaNumero?numero=${numero}&
                    idfactura=${idfactura}&access_token=${token}`;
    return this.http
      .put<facturaInterface>(urlApi, numero, idfactura);
  }

  // --Historial
   listaFacturaProcesado() {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/facturas/facturaClienteProcesado?access_token=${token}`;
    return this.http.get(urlApi, { headers: this.headers })
    .pipe(map(data => data));
  }
  soloNumero(numero, idfactura) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/facturas/soloNumero?numero=${numero}&idfactura=${idfactura}&access_token=${token}`;
    return this.http
      .put<facturaInterface>(urlApi, numero, idfactura);
  }
  soloEstado(idfactura) {
    const token = this.authService.getToken();
    const urlApi = `https://cpm-api.herokuapp.com/api/facturas/soloEstado?idfactura=${idfactura}&access_token=${token}`;
    return this.http
      .put<facturaInterface>(urlApi, idfactura, { headers: this.headers })
      .pipe(map(data => data));
  }
}