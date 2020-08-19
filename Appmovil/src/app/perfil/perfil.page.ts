import { Component, OnInit } from '@angular/core';
import { AuthserviceService } from '../servicios/authservice.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {

  constructor(private authService: AuthserviceService) { }
  cliente;

  ngOnInit() {
    this.cliente = this.authService.getCurrentCliente();
  }
  salir() {
    this.authService.cerrarSesion();
    location.reload();
  }
}
