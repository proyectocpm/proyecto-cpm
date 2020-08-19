import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

import { faUserCog } from '@fortawesome/free-solid-svg-icons';
import { faCashRegister } from '@fortawesome/free-solid-svg-icons';
import { faUtensils } from '@fortawesome/free-solid-svg-icons';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';



@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(public authService: AuthService) { }
  faUserCog = faUserCog;
  faCashRegister = faCashRegister;
  faUtensils = faUtensils;
  faClipboardList = faClipboardList;
  faSignInAlt = faSignInAlt;
  faSignOutAlt = faSignOutAlt;
  public app_name = 'Cevicheria ';
  public isLogged = false;
  public rolAutorizado = false;
  public estado = false;
  usuario;
  RolUser;
  estadoUsuario;
  ngOnInit() {
    this.OnVerificar();
    this.verificaRol();
    this.verificaEstado();
  }
  onLogout(): void {
    this.authService.logoutUser();
  }
  OnVerificar(): void {
    if (this.authService.getCurrentUser() === null) {
      this.isLogged = false;
    } else {
      this.isLogged = true;
    }
  }
  verificaRol() {
    if (this.authService.getCurrentUser().roleId === 1 && this.authService.getCurrentUser().estado === 'Activo') {
      this.rolAutorizado = true;
    } else {
      this.rolAutorizado = false;
    }
    this.verificaEstado();
  }
  verificaEstado(): void {
    if (this.authService.getCurrentUser().estado === 'Activo') {
      this.estado = true;
    } else {
      this.estado = false;
    }
  }
}
