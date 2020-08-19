import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'busquedaProducto'
})
export class BusquedaProductoPipe implements PipeTransform {

  transform(value= [], arg: any): any {
    const resultadoProducto = [];
    for (const producto of value) {
      if (producto.nombre.toLowerCase().includes(arg.toLowerCase())) {
        resultadoProducto.push(producto);
      }
    }
    return resultadoProducto;
  }

}
