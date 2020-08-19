'use strict';

module.exports = function (Producto) {
    Producto.obtieneProductos = function (cb) {
        var sql = 'SELECT pr.id, pr.nombre, pr.precio, pr.descripcion, pr.urlImagen, pr.stock, pr.idcategoria, ct.nombreCategoria as categoria FROM producto pr LEFT JOIN categoria ct ON pr.idcategoria = ct.id ';
        var params = [];
        Producto.dataSource.connector.query(sql, params, cb)
    };
    Producto.remoteMethod("obtieneProductos", {
        returns: {
          arg: "Producto",
          type: "object", root: true
        },
        http: {
          path: "/obtieneProductos",
          verb: "get" 
        },
        description: [
          'Obtiene los productos',
        ]});
  
};
