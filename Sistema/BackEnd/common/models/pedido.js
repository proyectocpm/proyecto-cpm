'use strict';
var OneSignal = require("onesignal-node");
module.exports = function(Pedido) {
  Pedido.conteoPedido = function(cb) {
    var sql = 'SELECT UPPER(concat(cl.nombre, " ", cl.apellido)) as nombre, cl.telefono, pe.numeropedido, pe.estado, COUNT(pe.numeropedido) as items, pe.idcliente, drc.sector, CONCAT(drc.calleprincipal, " ", "y", " ", drc.callesecundaria, " ","#", " ", drc.numero) as direccionEnvio FROM cliente cl LEFT JOIN pedido pe ON pe.idcliente = cl.id LEFT JOIN direccionCliente drc on drc.idcliente = cl.id and drc.numeropedido = pe.numeropedido WHERE pe.estado ="Pendiente" GROUP BY pe.numeropedido';
    var params = [];
    Pedido.dataSource.connector.query(sql, params, cb)
  };
  Pedido.remoteMethod("conteoPedido", {
    returns: {
      arg: "pedido",
      type: "object", root: true
    },
    http: {
      path: "/conteoPedido",
      verb: "get"
    }
  })

  // Historial
  Pedido.conteoPedidoHis = function(cb) {
    var sql = 'SELECT UPPER(concat(cl.nombre, " ", cl.apellido)) as nombre, cl.telefono, pe.numeropedido, pe.estado, COUNT(pe.numeropedido) as items, pe.idcliente, pe.fechaPedido, drc.sector, CONCAT(drc.calleprincipal, " ", "y", " ", drc.callesecundaria, " ","#", " ", drc.numero)as direccionEnvioH FROM cliente cl LEFT JOIN pedido pe ON pe.idcliente = cl.id LEFT JOIN direccionCliente drc on drc.idcliente = cl.id and drc.numeropedido = pe.numeropedido WHERE pe.estado ="Procesado" GROUP BY pe.numeropedido'
    var params = [];
    Pedido.dataSource.connector.query(sql, params, cb)
  };
  Pedido.remoteMethod("conteoPedidoHis", {
    returns: {
      arg: "pedido",
      type: "object", root: true
    },
    http: {
      path: "/conteoPedidoHis",
      verb: "get"
    }
  })

  Pedido.detallePedidoPorId = function(numeropedido, cb) {
    var sql = 'SELECT pe.fechaPedido, pe.numeropedido, pe.cantidad, precio AS preciounitario,convert(precio*cantidad, decimal(4,2)) AS preciototal, pe.id AS idpedido, pr.nombre AS nombreProducto FROM pedido pe LEFT JOIN producto pr ON pe.idproducto = pr.id WHERE numeropedido=?';
    var params = [numeropedido];
    Pedido.dataSource.connector.query(sql, params, cb)
  };
  Pedido.remoteMethod("detallePedidoPorId", {
    returns: {
      arg: "pedido",
      type: "object", root: true
    },
    http: {
      path: "/detallePedidoPorId",
      verb: "get" 
    },
    description: [
      'Obtiene detalle del pedido',
    ],
    accepts: [
      {
        arg: 'numeropedido',
        type: 'number',
        required: true,
      },]
  })
  Pedido.actualizaEstado = function(numeropedido, cb) {
    var sql = 'UPDATE pedido SET estado = "Procesado" WHERE numeropedido = ?';
    var params = [numeropedido];
    Pedido.dataSource.connector.query(sql, params, cb)
  };
  Pedido.remoteMethod("actualizaEstado", {
    returns: {
      arg: "pedido",
      type: "object", root: true
    },
    http: {
      path: "/actualizaEstado",
      verb: "put"
    },
    description: [
      'Actualiza el estado de los pedidos procesados',
    ],
    accepts: [
      {
        arg: 'numeropedido',
        type: 'number',
        required: true,
      },]
  })
// historial
Pedido.itemEnviado = function(productoEnviado, id, cb) {
  var sql = 'UPDATE pedido SET productoEnviado = ? WHERE id = ?';
  var params = [productoEnviado,id];
  Pedido.dataSource.connector.query(sql, params, cb)
};
Pedido.remoteMethod("itemEnviado", {
  returns: {
    arg: "pedido",
    type: "object", root: true
  },
  http: {
    path: "/itemEnviado",
    verb: "put"
  },
  description: [
    'Actualiza el estado de los pedidos a procesados',
  ],
  accepts: [
    {
      arg: 'productoEnviado',
      type: 'string',
      required: true,
    },
    {
      arg: 'id',
      type: 'number',
      required: true,
    },
    ]
})

Pedido.estadoInicial = function(numeropedido, cb) {
  var sql = 'UPDATE pedido SET productoEnviado = "NO" WHERE numeropedido = ?';
  var params = [numeropedido];
  Pedido.dataSource.connector.query(sql, params, cb)
};
Pedido.remoteMethod("estadoInicial", {
  returns: {
    arg: "Pedido",
    type: "object", root: true
  },
  http: {
    path: "/estadoInicial",
    verb: "put"
  },
  description: [
    'Actualiza a NO si no se procesa el pedido',
  ],
  accepts: [
    {
      arg: 'numeropedido',
      type: 'number',
      required: true,
    },]
})

// NOTIFICaCION
Pedido.notificacion = function(cb){
  var sendNotification = function(data) {
    var headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic N2Q4ZmY0ZmQtMzJiYS00NTZhLTkzY2YtMDBiMTEwNTAzNTA2"
    };
    
    var options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };
    
    var https = require('https');
    var req = https.request(options, function(res) {  
      res.on('data', function(data) {
        console.log("Response:");
        console.log(JSON.parse(data));
      });
    });
    
    req.on('error', function(e) {
      console.log("ERROR:");
      console.log(e);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  };
  
  var message = { 
    app_id: "38204edc-de9d-41bf-ba3c-b956dd7d524b",
    contents: {"en": "Nuevo Pedido"},
    included_segments: ["Subscribed Users"]
  };
    sendNotification(message);
  cb(null, 'notificacion enviada');
}
Pedido.remoteMethod("notificacion", {
  returns: {
    arg: "pedido",
    type: "string",  root: true
  },
  http:{
    path:"/notificacion",
    verb: "get"
  },
  description: [
    'Envia notificacion'
  ]
})

};

  