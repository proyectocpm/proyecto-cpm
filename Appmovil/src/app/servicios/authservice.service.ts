import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClienteInterface } from '../Modelos/cliente-interface';
import { map } from 'rxjs/operators';
import { isNullOrUndefined } from 'util';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthserviceService {

  constructor(private http: HttpClient) { }

  headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  registroCliente(cliente) {
    const urlApi = `https://cpm-api.herokuapp.com/api/Clientes`;
    return this.http.post<ClienteInterface>(urlApi, cliente, {headers: this.headers}).pipe(map(data => data));
  }
  loginCliente(email: string, password: string): Observable<any> {
    const urlApi = `https://cpm-api.herokuapp.com/api/clientes/login?include=cliente`;
    return this.http.post<ClienteInterface>(urlApi, {
      email,
      password
    }, {headers: this.headers}).pipe(map(data => data));
  }
  setCliente(cliente: ClienteInterface): void {
    const clienteString = JSON.stringify(cliente);
    localStorage.setItem('currentCliente', clienteString);
  }
  setToken(token) {
    localStorage.setItem('accessToken', token);
  }
  getToken() {
    return localStorage.getItem('accessToken');
  }

  getCurrentCliente() {
    const clienteString = localStorage.getItem('currentCliente');
    if (!isNullOrUndefined(clienteString)) {
      const cliente: ClienteInterface = JSON.parse(clienteString);
      return cliente;
    } else {
      return null;
    }
  }
  listaCliente() {
    const token = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/clientes?access_token=${token}`;
    return this.http.get<ClienteInterface>(urlApi, {headers: this.headers}).pipe(map(data => data));
  }
    cerrarSesion() {
    const accessToken = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/clientes/logout?access_token=${accessToken}`;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentCliente');
    return this.http.post<ClienteInterface>(urlApi, { headers: this.headers });
  }
  // --------- ACTUALIZA TABLA CLIENTE PARA DATOS DE FACTURA
  datosFactura(cliente) {
    const id = cliente.id;
    const direccion = cliente.direccion;
    const identificacion = cliente.identificacion;
    const telefono = cliente.telefono;
    const token = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/clientes/datosFactura?direccion=${direccion}
                    &identificacion=${identificacion}&telefono=${telefono}&id=${id}&access_token=${token}`;
    return this.http.put(urlApi, cliente); // ver la actualizacion x defecto de lopback
  }
  clientePorId() {
    const id = this.getCurrentCliente().id;
    const token = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/clientes/${id}?access_token=${token}`;
    return this.http.get(urlApi);
  }
  // const urlApi = `http://localhost:3000/api/clientes/${id}?access_token=${token}`;

}
