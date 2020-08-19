'use strict';

module.exports = function(Pago) {
  Pago.sendEmail = (direccionEmail, asunto, mensaje, archivo, cb) => {
    Pago.app.models.Email.send({
      to: direccionEmail,
      from: 'cpmec.593@gmail.com',
      subject: asunto,
      text: 'Mensaje enviado automaticamente',
      html: mensaje,
      attachments: [
        {
          filename: archivo,
          path: 'C:/../../Orden-pedido'+archivo,
        },
      ], 
    }, function(err, mail) {

      console.log(archivo);
      console.log('email enviado');
      if (err) return err;
    });
    cb(null, 'mensaje enviado: ' + mensaje);
  };

  Pago.remoteMethod('sendEmail',
    {
      http: {
        path: '/enviarEmail', verb: 'get',
      },
      description: [
        'EndPoint para enviar correo electronico',
      ],
      accepts: [
        {
          arg: 'direccionEmail',
          type: 'string',
          required: true,
        },
        {
          arg: 'asunto',
          type: 'string',
          required: true,
        },
        {
          arg: 'mensaje',
          type: 'string',
          required: false,
        },
        {
          arg: 'archivo',
          type: 'string',
          required: true,
        },
      ],
      returns: {arg: 'Email', type: 'string'},
    });
};
