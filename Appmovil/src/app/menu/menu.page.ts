import { Component } from '@angular/core';
import { DataApiService } from '../servicios/data-api.service';
import { AuthserviceService } from '../servicios/authservice.service';

@Component({
  selector: 'app-manu',
  templateUrl: 'menu.page.html',
  styleUrls: ['menu.page.scss']
})
export class MenuPage {

  constructor(private dataApi: DataApiService, private authService: AuthserviceService) {}
  autorizado = false;

  ngOnInit() {
    this.verifica();
  }
  verifica() {
    if (this.authService.getCurrentCliente() === null) {
      this.autorizado = false;
    } else {
      this.autorizado = true;
    }
  }
}
