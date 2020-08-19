import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioInterface } from 'src/app/modelos/usuario-interface';
import { NgForm } from '@angular/forms';

import { faUserEdit } from '@fortawesome/free-solid-svg-icons';
import { faUserTimes } from '@fortawesome/free-solid-svg-icons';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';

declare var $: any;

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnInit {

  constructor(public authService: AuthService, public router: Router) { }
  usuarios;
  todoUsuario;
  usuariosE;
  faUserEdit = faUserEdit;
  faUserTimes = faUserTimes;
  faUserPlus = faUserPlus;
  faSave = faSave;
  faUserCheck = faUserCheck;
  error = false;
  mensaje = '';
  existe = false;
  mensajeNombre = '';
  existeNombre = false;
  paginaActual = 1;
  public usuario: UsuarioInterface = {
    nombre: '',
    email: '',
    password: '',
    roleId: 2
  };
  ngOnInit() {
    this.listaUsuario();
  }

  listaUsuario(): void {
    if (this.authService.getCurrentUser().roleId === 1 && this.authService.getCurrentUser().estado === 'Activo') {
      this.authService.listaUsuario().subscribe((usuarios) => (this.usuarios = usuarios));
      this.authService.listaTodoUsuario().subscribe((todoUsuario) => (this.todoUsuario = todoUsuario));
      this.authService.listaUsuarioEliminado().subscribe((usuariosE) => (this.usuariosE = usuariosE));
    }
  }

  guardaUsuario(usuarioForm: NgForm): void {
    const emails = [], emailsE = [];
    const nombres = [], nombresE = [];
    this.existeNombre = false;
    this.existe = false;
    if (usuarioForm.value.id == null) {
      if (usuarioForm.valid) {
        for (const item of this.usuarios) {
          emails.push(item.email);
          nombres.push(item.nombre);
        }
        for (const item of this.usuariosE) {
          emailsE.push(item.email);
          nombresE.push(item.nombre);
        }
        if (nombres.includes(usuarioForm.value.nombre)) {
          this.mensajeNombre = 'El nombre ingresado ya existe';
          this.existeNombre = true;
        } else if (nombresE.includes(usuarioForm.value.nombre)) {
          this.mensajeNombre = 'El nombre ingresado es de un usuario eliminado';
          this.existeNombre = true;
        } else if (emails.includes(usuarioForm.value.email)) {
          this.mensaje = 'El email ingresado ya existe';
          this.existe = true;
        } else if (emailsE.includes(usuarioForm.value.email)) {
          this.mensaje = 'El email ingresado es de un usuario eliminado';
          this.existe = true;
        } else {
          this.authService.registroUsuario(usuarioForm.value).subscribe(usuario => this.listaUsuario(), error => this.muestraError());
          $('#modalusuario').modal('hide');
        }
      } else {
        this.muestraError();
      }
    } else {
      if (usuarioForm.valid) {
        this.authService.actualizaUsuario(usuarioForm.value).subscribe(usuario => this.listaUsuario(), error => this.muestraError());
        $('#modalusuario').modal('hide');
      } else {
        this.muestraError();
      }
    }
  }

  seleccionaUsuario(usuario: UsuarioInterface): void {
    this.authService.seleccionaUsuario = Object.assign({}, usuario);
  }
  eliminaUsuario(id): void {
    if (confirm('¿Desea eliminar el usuario?')) {
      this.authService.eliminaUsuario(id).subscribe(usuario => this.listaUsuario());
    }
  }
  restableceUsuario(id): void {
    if (confirm('¿Desea reestablecer el usuario?')) {
      this.authService.restableceUsuario(id).subscribe(usuario => this.listaUsuario());
    }
  }
  reseteoForm(usuarioForm?: NgForm): void {
    this.authService.seleccionaUsuario = {
      id: null,
      nombre: '',
      email: '',
      password: '',
      roleId: 0,
      estado: ''
    };
  }
  muestraError(): void {
    this.error = true;
    setTimeout(() => {
      this.error = false;
    }, 3000);
  }
}
