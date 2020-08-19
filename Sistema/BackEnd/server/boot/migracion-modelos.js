/*
// eslint-disable-next-line strict
module.exports = function(app) {
  var ds = app.dataSources.db;
  // eslint-disable-next-line max-len
  var dbTables = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role', 'categoria', 'cliente',
    'detallefactura', 'factura', 'pago', 'pedido', 'producto', 'direccionCliente', 'usuario']; // En este array pondremos los nombres de los modelos
  if (dbTables.length !== 0) {
    ds.automigrate(dbTables, function(err) {
      if (err) throw err;

      // eslint-disable-next-line max-len
      console.log('Tabla/s => [' + dbTables + '] creadas.\nEn:', ds.adapter.name);
    });
  } else {
    console.log('No hay tablas por crear.');
  }
  // ds.disconnect(); //Descomentar si se pone fuera de la carpeta boot
};
*/