import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { isNullOrUndefined } from 'util';
import { map } from 'rxjs/operators';
import { UsuarioInterface } from '../modelos/usuario-interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }
  headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'

  });
  public seleccionaUsuario: UsuarioInterface = {
    id: null,
    nombre: '',
    email: '',
    password: '',
    roleId: 0,
    estado: ''
  };
  loginuser(email: string, password: string): Observable<any> {
    const urlApi = `https://cpm-api.herokuapp.com/api/usuarios/login?include=usuario`;
    return this.http.post<UsuarioInterface>(urlApi, {
      email,
      password
    },
      { headers: this.headers }).pipe(map(data => data));
  }


  setUser(usuario: UsuarioInterface): void {
    const usuarioString = JSON.stringify(usuario);
    localStorage.setItem('currentUser', usuarioString);
  }
  setToken(token) {
    localStorage.setItem('accessToken', token);
  }
  getToken() {
    return localStorage.getItem('accessToken');
  }

  getCurrentUser() {
    const usuarioString = localStorage.getItem('currentUser');
    if (!isNullOrUndefined(usuarioString)) {
      const usuario: UsuarioInterface = JSON.parse(usuarioString);
      return usuario;
    } else {
      return null;
    }
  }
  registroUsuario(usuario) {
    const token = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/usuarios?access_token=${token}`;
    return this.http.post<UsuarioInterface>(urlApi, usuario, { headers: this.headers }).pipe(map(data => data));
  }
  logoutUser() {
    const accessToken = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/usuarios/logout?access_token=${accessToken}`;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    return this.http.post<UsuarioInterface>(urlApi, { headers: this.headers });
  }

  listaUsuario() {
    const token = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/usuarios/obtieneUsuario?access_token=${token}`;
    return this.http.get<UsuarioInterface>(urlApi, { headers: this.headers }).pipe(map(data => data));
  }
  actualizaUsuario(usuario) {
    const token = localStorage.getItem('accessToken');
    const id = usuario.id;
    const urlApi = `https://cpm-api.herokuapp.com/api/usuarios/${id}?access_token=${token}`;
    return this.http.put<UsuarioInterface>(urlApi, usuario, { headers: this.headers }).pipe(map(data => data));
  }
  eliminaUsuario(id) {
    const token = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/usuarios/cambiaEstado?id=${id}&access_token=${token}`;
    return this.http.put<UsuarioInterface>(urlApi, id, { headers: this.headers }).pipe(map(data => data));
  }
  listaTodoUsuario() {
    const token = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/usuarios?access_token=${token}`;
    return this.http.get<UsuarioInterface>(urlApi, { headers: this.headers }).pipe(map(data => data));
  }

  // Eliminado
  listaUsuarioEliminado() {
    const token = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/usuarios/obtieneUsuarioEliminado?access_token=${token}`;
    return this.http.get<UsuarioInterface>(urlApi, { headers: this.headers }).pipe(map(data => data));
  }
  restableceUsuario(id) {
    const token = localStorage.getItem('accessToken');
    const urlApi = `https://cpm-api.herokuapp.com/api/usuarios/restableceEstado?id=${id}&access_token=${token}`;
    return this.http.put<UsuarioInterface>(urlApi, id, { headers: this.headers }).pipe(map(data => data));
  }
}
