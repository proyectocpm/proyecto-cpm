'use strict';

module.exports = function(Detallefactura) {

    Detallefactura.eliminaPorIDpedido = function(idpedido, cb) {
        var sql = 'DELETE FROM detallefactura WHERE idpedido = ?';
        var params = [idpedido];
        Detallefactura.dataSource.connector.query(sql, params, cb)
      };
      Detallefactura.remoteMethod("eliminaPorIDpedido", {
        returns: {
          arg: "detallefactura",
          type: "object", root: true
        },
        http: {
          path: "/eliminaPorIdPedido",
          verb: "delete"
        },
        description: [
          'Elimina registros de detalle factura por idpedido',
        ],
        accepts: [
          {
            arg: 'idpedido',
            type: 'number',
            required: true,
          },]
      })
    Detallefactura.eliminaCancelaPedido = function(numeropedido, cb) {
        var sql = 'DELETE FROM detallefactura WHERE numeropedido = ?';
        var params = [numeropedido];
        Detallefactura.dataSource.connector.query(sql, params, cb)
      };
      Detallefactura.remoteMethod("eliminaCancelaPedido", {
        returns: {
          arg: "detallefactura",
          type: "object", root: true
        },
        http: {
          path: "/eliminaCancelaPedido",
          verb: "delete"
        },
        description: [
          'Elimina registros de detalle factura al elegir cancelar la facturacion',
        ],
        accepts: [
          {
            arg: 'numeropedido',
            type: 'number',
            required: true,
          },]
      })

    Detallefactura.actualizaId = function(numeropedido, cb) {
        var sql = 'UPDATE detallefactura SET idfactura = (select max(id) id from factura) WHERE numeropedido = ?';
        var params = [numeropedido];
        Detallefactura.dataSource.connector.query(sql, params, cb)
      };
      Detallefactura.remoteMethod("actualizaId", {
        returns: {
          arg: "detallefactura",
          type: "object", root: true
        },
        http: {
          path: "/actualizaId",
          verb: "put"
        },
        description: [
          'Actualiza el campo idFactura con el id de factura',
        ],
        accepts: [
          {
            arg: 'numeropedido',
            type: 'number',
            required: true,
          },]
      })
};
 