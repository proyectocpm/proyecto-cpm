'use strict';

module.exports = function(Categoria) {
    Categoria.productoPorCategoria = function(idcategoria, cb) {
        var sql = 'SELECT ct.nombreCategoria, 0 as cantidad, 0 as visible, "false" as seleccion, pr.* FROM categoria ct left join producto pr on ct.id = pr.idCategoria WHERE ct.id = ?';
        var params = [idcategoria];
        Categoria.dataSource.connector.query(sql, params, cb)
      };
      Categoria.remoteMethod("productoPorCategoria", {
        returns: {
          arg: "categoria",
          type: "object", root: true
        },
        http: {
          path: "/productoPorCategoria",
          verb: "get"
        },
        description: [
          'Obtiene los productos por categoria',
        ],
        accepts: [
          {
            arg: 'idcategoria',
            type: 'number',
            required: true,
          },]
      })
};
