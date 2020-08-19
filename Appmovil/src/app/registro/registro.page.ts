import { Component, OnInit } from '@angular/core';
import { AuthserviceService } from '../servicios/authservice.service';
import { NgForm } from '@angular/forms';
import { ClienteInterface } from '../Modelos/cliente-interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
})
export class RegistroPage implements OnInit {

  constructor(private authService: AuthserviceService, private router: Router) { }
  clientes;
  mensaje;
  error = false;
  existe = false;
  private cliente: ClienteInterface = {
    id: '',
    identificacion: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: null,
    direccion: ''
  }; 
  ngOnInit() {
    this.listaCliente();
  }
  listaCliente() {
    this.authService.listaCliente().subscribe((clientes) => (this.clientes = clientes));
  }

  guardaCliente(clienteForm: NgForm): void {
    const emails = [];
    for (const item of this.clientes) {
      emails.push(item.email);
    }
    if (clienteForm.valid) {
      if (emails.includes(clienteForm.value.email)) {
        this.mensaje = 'El email ingresado ya existe';
        this.existe = true;
      } else {
        this.authService.registroCliente(clienteForm.value).subscribe(
          cliente => {
            this.authService.setCliente(cliente);
            const token = cliente.id;
            this.authService.setToken(token);
            this.router.navigate(['/menu']);
          });
        this.existe = false;
      }
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
