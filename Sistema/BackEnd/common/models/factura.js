'use strict';

module.exports = function(Factura) {
  Factura.facturaCliente = function(cb) {
    var sql = 'SELECT DISTINCT  pe.numeropedido, cl.identificacion, UPPER(concat(cl.nombre, " ", cl.apellido)) AS nombre, cl.email, cl.telefono, cl.direccion, fa.id, fa.numero, fa.subtotal, fa.iva, fa.total, fa.estado FROM cliente cl INNER JOIN pedido pe ON pe.idcliente = cl.id INNER JOIN detallefactura dt ON dt.idpedido = pe.id  INNER JOIN factura fa ON dt.idfactura=fa.id WHERE fa.estado IN ("Pendiente", "Generado")';
    var params = [];
    Factura.dataSource.connector.query(sql, params, cb)
  };
  Factura.remoteMethod("facturaCliente", {
    returns: {
      arg: "factura",
      type: "object", root: true
    },
    http: {
      path: "/facturaCliente",
      verb: "get" 
    },
    description: [
      'Obtiene datos del factura y cliente',
    ]
  })
// Historial
Factura.facturaClienteProcesado = function(cb) {
  var sql = 'SELECT DISTINCT   pe.numeropedido, cl.identificacion, UPPER(concat(cl.nombre, " ", cl.apellido)) AS nombre, cl.email, cl.telefono, cl.direccion, fa.id, fa.numero, fa.subtotal, fa.iva, fa.total, fa.estado FROM cliente cl INNER JOIN pedido pe ON pe.idcliente = cl.id INNER JOIN detallefactura dt ON dt.idpedido = pe.id  INNER JOIN factura fa ON dt.idfactura=fa.id WHERE fa.estado = "Procesado"';
  var params = [];
  Factura.dataSource.connector.query(sql, params, cb)
};
Factura.remoteMethod("facturaClienteProcesado", {
  returns: {
    arg: "factura",
    type: "object", root: true
  },
  http: {
    path: "/facturaClienteProcesado",
    verb: "get" 
  },
  description: [
    'Obtiene datos del factura y cliente procesados_ fin proceso factura',
  ]
})


    Factura.detFacPorIdFactura = function(idfactura, cb) {
        var sql = 'SELECT dt.fechaFacturacion, dt.cantidad, dt.preciounitario, dt.preciototal, pr.nombre AS producto, dt.idfactura FROM detallefactura dt LEFT JOIN pedido pe ON dt.idpedido = pe.id LEFT JOIN producto pr ON pe.idproducto = pr.id WHERE dt.idfactura = ?';
        var params = [idfactura];
        Factura.dataSource.connector.query(sql, params, cb)
      };
      Factura.remoteMethod("detFacPorIdFactura", {
        returns: {
          arg: "factura",
          type: "object", root: true
        },
        http: {
          path: "/detFacPorIdFactura",
          verb: "get" 
        },
        description: [
          'Obtiene detalle de factura a traves del idFactura',
        ],
        accepts: [
          {
            arg: 'idfactura',
            type: 'number',
            required: true,
          },]
      })
      Factura.clienteFacturaId = function(idfactura, cb) {
        var sql = 'SELECT cl.identificacion, UPPER(concat(cl.nombre, " ", cl.apellido)) AS nombre, cl.email, cl.telefono, cl.direccion, fa.id as idFactura, fa.numero, fa.subtotal, fa.iva, fa.total, fa.estado, DATE_FORMAT(dt.fechaFacturacion,"%Y-%m-%d") as fechaFacturacion, pe.numeropedido FROM cliente cl LEFT JOIN pedido pe ON pe.idcliente = cl.id LEFT JOIN detallefactura dt ON dt.idpedido = pe.id  LEFT JOIN factura fa ON dt.idfactura=fa.id WHERE dt.idfactura = ? LIMIT 1';
        var params = [idfactura];
        Factura.dataSource.connector.query(sql, params, cb)
      };
      Factura.remoteMethod("clienteFacturaId", {
        returns: {
          arg: "factura",
          type: "object", root: true
        },
        http: {
          path: "/clienteFacturaId",
          verb: "get" 
        },
        description: [
          'Obtiene datos del cliente y factura a traves del idFactura',
        ],
        accepts: [
          {
            arg: 'idfactura',
            type: 'number',
            required: true,
          },]
      })
      Factura.actualizaNumero = function(numero, idfactura, cb) {
        var sql = 'UPDATE factura SET numero = ?, estado = "Generado" WHERE id = ?';
        var params = [numero, idfactura];
        Factura.dataSource.connector.query(sql, params, cb)
      };
      Factura.remoteMethod("actualizaNumero", {
        returns: {
          arg: "factura",
          type: "object", root: true
        },
        http: {
          path: "/actualizaNumero",
          verb: "put" 
        },
        description: [
          'actualiza numero de factura',
        ],
        accepts: [
          {
            arg: 'numero',
            type: 'number',
            required: true,
          },
          {
            arg: 'idfactura',
            type: 'number',
            required: true,
          },]
      })
      // historial
      Factura.soloNumero = function(numero, idfactura, cb) {
        var sql = 'UPDATE factura SET numero = ? WHERE id = ?';
        var params = [numero, idfactura];
        Factura.dataSource.connector.query(sql, params, cb)
      };
      Factura.remoteMethod("soloNumero", {
        returns: {
          arg: "factura",
          type: "object", root: true
        },
        http: {
          path: "/soloNumero",
          verb: "put" 
        },
        description: [
          'actualiza numero de factura',
        ],
        accepts: [
          {
            arg: 'numero',
            type: 'number',
            required: true,
          },
          {
            arg: 'idfactura',
            type: 'number',
            required: true,
          },]
      })
      Factura.soloEstado = function( idfactura, cb) {
        var sql = 'UPDATE factura SET  estado = "Procesado" WHERE id = ?';
        var params = [idfactura];
        Factura.dataSource.connector.query(sql, params, cb)
      };
      Factura.remoteMethod("soloEstado", {
        returns: {
          arg: "factura",
          type: "object", root: true
        },
        http: {
          path: "/soloEstado",
          verb: "put" 
        },
        description: [
          'actualiza estado a "Procesado" de factura',
        ],
        accepts: [
          {
            arg: 'idfactura',
            type: 'number',
            required: true,
          },]
      })
};

