import { CategoriaInterface } from './../Modelos/categoria-interface';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataApiService } from '../servicios/data-api.service';
import { ProductoCategoriaInterface } from '../Modelos/productoCategoria-interface';
import { isNgTemplate } from '@angular/compiler';
import { PedidoInterface } from '../Modelos/pedido-interface';
import { AuthserviceService } from '../servicios/authservice.service';
// var el = document.getElementById('boton');
@Component({
  selector: 'app-producto',
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss'],
})
export class ProductoPage implements OnInit {

  constructor(private dataApi: DataApiService, private activatedRoute: ActivatedRoute, private router: Router,
  private authService: AuthserviceService) { }
  id;
  productos;
  pedidos;
  categoria: any = [];
  stock = [];
  cantidad = 0;
  limiteStock;
  cont = 0;
  numeropedido;
  finaliza = false;
  idProducto;
  idCliente;
  arrayTemporalId = [];
  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(paramMap => {
      this.id = paramMap.get('id');
    });
    this.productosPorCategoria();
    this.categoriaPorId();
    this.obtieneCliente();
  }
  ionViewWillEnter() {
    this.cont = this.dataApi.obtieneCantidad();
  }
    productosPorCategoria() {
     this.dataApi.productoPorCategoria(this.id).subscribe((productos) => 
     {this.productos = productos;
     this.productoSeleccionado();
     });
     if (this.dataApi.contadorProductos === 0) {
      this.finaliza = false;
    } else {
      this.finaliza = true;
    }
  }
  categoriaPorId(): void {
    this.dataApi.categoriPorId(this.id).subscribe(
      res => {
        this.categoria = res;
      }
    );
  }
  obtieneCliente() {
    this.idCliente = this.authService.getCurrentCliente().id;
  }
  productoSeleccionado() {
    let productosPedidos;
    productosPedidos = this.dataApi.obtienePedido();
    for (const item of productosPedidos) {
      this.arrayTemporalId.push(item.idproducto);
    }
    for (const item of this.productos) {
      if (this.arrayTemporalId.includes(item.id)) {
         for (const itemT of productosPedidos) {
          if (item.id === itemT.idproducto) {
            item.seleccion = true;
            item.cantidad = itemT.cantidad;
            item.visible = 1;
          }
        }
      }
    }
  }
  selecciona(estado: any, idProducto) {
  //  let ass;
    let precioT;
   // ass = this.dataApi.obtienePedido();
    for (const item of this.productos) {
      if (idProducto === item.id) {
        if (estado.currentTarget.checked === true) {
          if (this.arrayTemporalId.includes(item.id)) {
          } else {
          item.seleccion = true;
          item.visible = 1;
          item.cantidad = 1;
          this.cantidad = 1;
          precioT = this.cantidad * item.precio;
          ++this.dataApi.contadorProductos;
          this.cont = this.dataApi.obtieneCantidad();
          this.dataApi.añadeProducto(0, this.cantidad, item.nombre, item.precio, precioT, idProducto, this.idCliente);
         // ass = this.dataApi.obtienePedido();
          }
        } else {
          item.seleccion = false;
          item.visible = 0;
          this.cantidad = 0;
          item.cantidad = 0;
          --this.dataApi.contadorProductos;
          this.cont = this.dataApi.obtieneCantidad();
          this.dataApi.eliminaProducto(idProducto);
          // ass = this.dataApi.obtienePedido();
        }
      }
    }
    if (this.dataApi.contadorProductos === 0) {
      this.finaliza = false;
    } else {
      this.finaliza = true;
    }
  }

  incrementa(idProducto) {
    // let ass;
    for (const item of this.productos) {
      if (idProducto === item.id) {
        this.cantidad = ++item.cantidad;
        this.dataApi.actualizaCantidad(idProducto, this.cantidad, item.precioT);
      }
    }
    // ass = this.dataApi.obtienePedido();
  }
  disminuye(idProducto) {
    for (const item of this.productos) {
      if (idProducto === item.id) {
        if (item.cantidad === 1) {
          this.cantidad = 1;
          item.cantidad = 1;
        } else {
          this.cantidad = --item.cantidad;
          this.dataApi.actualizaCantidad(idProducto, this.cantidad, item.precioT);
        }
      }
    }
  }
  finCompra() {
    this.router.navigate(['menu/carrito']);
  }
}
