import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'busquedaFactura'
})
export class BusquedaFacturaPipe implements PipeTransform {

  transform(value= [], arg: any): any {
    const resultadoFactura = [];
    for (const factura of value) {
      if (factura.nombre.toLowerCase().includes(arg.toLowerCase())) {
        resultadoFactura.push(factura);
      }
    }
    return resultadoFactura;
  }

}
