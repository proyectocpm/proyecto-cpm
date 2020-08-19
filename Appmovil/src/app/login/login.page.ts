import { Component, OnInit } from '@angular/core';
import { AuthserviceService } from '../servicios/authservice.service';
import { Router } from '@angular/router';
import { ClienteInterface } from '../Modelos/cliente-interface';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  constructor(private authService: AuthserviceService, private router: Router) { }
  private cliente: ClienteInterface = {
    email: '',
    password: ''
  };
  error = false;

  ngOnInit() {
  }
  inicioSesion(form: NgForm) {
    if (form.valid) {
      return this.authService.loginCliente(this.cliente.email, this.cliente.password)
        .subscribe(data => {
          this.authService.setCliente(data.cliente);
          const token = data.id;
          this.authService.setToken(token);
          this.router.navigate(['/menu']);
          this.error = false;
        }, error => this.muestraError()
        );
    } else {
      this.muestraError();
    }
  }

  muestraError(): void {
    this.error = true;
    setTimeout(() => {
      this.error = false;
    }, 3000);
  }
}
