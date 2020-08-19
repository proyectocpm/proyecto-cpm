import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { UsuarioInterface } from 'src/app/modelos/usuario-interface';
import { NgForm } from '@angular/forms';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(public authservice: AuthService, public router: Router) { }
  usuario: UsuarioInterface = {
    email: '',
    password: ''
  };
  public mensajeError = false;
  ngOnInit() {
  }
  login(form: NgForm) {
    if (form.valid) {
      return this.authservice.loginuser(this.usuario.email, this.usuario.password)
        .subscribe(data => {
          this.authservice.setUser(data.usuario);
          const token = data.id;
          this.authservice.setToken(token);
          this.router.navigate(['/pedido']);
          this.mensajeError = false;
        }, error => this.Error()
        );
    } else {
      this.Error();
    }
  }

  Error(): void {
    this.mensajeError = true;
    setTimeout(() => {
      this.mensajeError = false;
    }, 3000);
  }
}


