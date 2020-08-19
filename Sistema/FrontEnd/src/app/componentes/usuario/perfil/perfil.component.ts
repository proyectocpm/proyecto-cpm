import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioInterface } from 'src/app/modelos/usuario-interface';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  constructor(public authService: AuthService) { }
  usuario: UsuarioInterface;
  ngOnInit() {
    this.usuario = this.authService.getCurrentUser();
  }

}
