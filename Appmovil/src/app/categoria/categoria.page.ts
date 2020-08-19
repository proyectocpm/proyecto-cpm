import { Component, HostBinding } from '@angular/core';
import { DataApiService } from '../servicios/data-api.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-categoria',
  templateUrl: 'categoria.page.html',
  styleUrls: ['categoria.page.scss']
})
export class CategoriaPage {
@HostBinding('class') classes = 'row';
  constructor(private dataApi: DataApiService, private router: Router) { }
  finaliza = false;
  categorias;
  contadorProducto;
  ionViewWillEnter() {
    this.listaCategoria();
    this.cantidad();
  }
  listaCategoria(): void {
    this.dataApi.obtieneCategoria().subscribe((categorias) => (this.categorias = categorias));
  }
  cantidad() {
    this.contadorProducto = this.dataApi.obtieneCantidad();
    if (this.dataApi.contadorProductos === 0) {
      this.finaliza = false;
    } else {
      this.finaliza = true;
    }
  }
  finCompra() {
    this.router.navigate(['menu/carrito']);
  }

}
