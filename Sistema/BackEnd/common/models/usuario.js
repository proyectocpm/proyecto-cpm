// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module Dependencies.
 */

'use strict';
var g = require('loopback/lib/globalize');
var isEmail = require('isemail');
var loopback = require('loopback/lib/loopback');
var utils = require('loopback/lib/utils');
var path = require('path');
var qs = require('querystring');
var SALT_WORK_FACTOR = 10;
var crypto = require('crypto');
// bcrypt's max length is 72 bytes;
// See https://github.com/kelektiv/node.bcrypt.js/blob/45f498ef6dc6e8234e58e07834ce06a50ff16352/src/node_blf.h#L59
var MAX_PASSWORD_LENGTH = 72;
var bcrypt;
try {
  // Try the native module first
  bcrypt = require('bcrypt');
  // Browserify returns an empty object
  if (bcrypt && typeof bcrypt.compare !== 'function') {
    bcrypt = require('bcryptjs');
  }
} catch (err) {
  // Fall back to pure JS impl
  bcrypt = require('bcryptjs');
}

var DEFAULT_TTL = 1209600; // 2 weeks in seconds
var DEFAULT_RESET_PW_TTL = 15 * 60; // 15 mins in seconds
var DEFAULT_MAX_TTL = 31556926; // 1 year in seconds
var assert = require('assert');

var debug = require('debug')('loopback:usuario');

/**
 * Built-in Usuario model.
 * Extends LoopBack [PersistedModel](#persistedmodel-new-persistedmodel).
 *
 * Default `Usuario` ACLs.
 *
 * - DENY EVERYONE `*`
 * - ALLOW EVERYONE `create`
 * - ALLOW OWNER `deleteById`
 * - ALLOW EVERYONE `login`
 * - ALLOW EVERYONE `logout`
 * - ALLOW OWNER `findById`
 * - ALLOW OWNER `updateAttributes`
 *
 * @property {String} nombre Must be unique.
 * @property {String} password Hidden from remote clients.
 * @property {String} email Must be valid email.
 * @property {Boolean} emailVerified Set when a usuario's email has been verified via `confirm()`.
 * @property {String} verificationToken Set when `verify()` is called.
 * @property {String} nombre The namespace the usuario belongs to. See [Partitioning usuarios with nombres](http://loopback.io/doc/en/lb2/Partitioning-usuarios-with-nombres.html) for details.
 * @property {Object} settings Extends the `Model.settings` object.
 * @property {Boolean} settings.emailVerificationRequired Require the email verification
 * process before allowing a login.
 * @property {Number} settings.ttl Default time to live (in seconds) for the `AccessToken` created by `Usuario.login() / usuario.createAccessToken()`.
 * Default is `1209600` (2 weeks)
 * @property {Number} settings.maxTTL The max value a usuario can request a token to be alive / valid for.
 * Default is `31556926` (1 year)
 * @property {Boolean} settings.nombreRequired Require a nombre when logging in a usuario.
 * @property {String} settings.nombreDelimiter When set a nombre is required.
 * @property {Number} settings.resetPasswordTokenTTL Time to live for password reset `AccessToken`. Default is `900` (15 minutes).
 * @property {Number} settings.saltWorkFactor The `bcrypt` salt work factor. Default is `10`.
 * @property {Boolean} settings.caseSensitiveEmail Enable case sensitive email.
 *
 * @class Usuario
 * @inherits {PersistedModel}
 */

module.exports = function(Usuario) {
  /**
   * Create access token for the logged in usuario. This method can be overridden to
   * customize how access tokens are generated
   *
   * Supported flavours:
   *
   * ```js
   * createAccessToken(ttl, cb)
   * createAccessToken(ttl, options, cb);
   * createAccessToken(options, cb);
   * // recent addition:
   * createAccessToken(data, options, cb);
   * ```
   *
   * @options {Number|Object} [ttl|data] Either the requested ttl,
   * or an object with token properties to set (see below).
   * @property {Number} [ttl] The requested ttl
   * @property {String[]} [scopes] The access scopes granted to the token.
   * @param {Object} [options] Additional options including remoting context
   * @callback {Function} cb The callback function
   * @param {String|Error} err The error string or object
   * @param {AccessToken} token The generated access token object
   * @promise
   *
   */
  Usuario.prototype.createAccessToken = function(ttl, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      // createAccessToken(ttl, cb)
      cb = options;
      options = undefined;
    }

    cb = cb || utils.createPromiseCallback();

    let tokenData;
    if (typeof ttl !== 'object') {
      // createAccessToken(ttl[, options], cb)
      tokenData = {ttl};
    } else if (options) {
      // createAccessToken(data, options, cb)
      tokenData = ttl;
    } else {
      // createAccessToken(options, cb);
      tokenData = {};
    }

    var usuarioSettings = this.constructor.settings;
    tokenData.ttl = Math.min(tokenData.ttl || usuarioSettings.ttl, usuarioSettings.maxTTL);
    this.accessTokens.create(tokenData, options, cb);
    return cb.promise;
  };

  function splitPrincipal(name, nombreDelimiter) {
    var parts = [null, name];
    if (!nombreDelimiter) {
      return parts;
    }
    var index = name.indexOf(nombreDelimiter);
    if (index !== -1) {
      parts[0] = name.substring(0, index);
      parts[1] = name.substring(index + nombreDelimiter.length);
    }
    return parts;
  }

  /**
   * Normalize the credentials
   * @param {Object} credentials The credential object
   * @param {Boolean} nombreRequired
   * @param {String} nombreDelimiter The nombre delimiter, if not set, no nombre is needed
   * @returns {Object} The normalized credential object
   */
  Usuario.normalizeCredentials = function(credentials, nombreRequired, nombreDelimiter) {
    var query = {};
    credentials = credentials || {};
    if (!nombreRequired) {
      if (credentials.email) {
        query.email = credentials.email;
      } else if (credentials.usuarioname) {
        query.usuarioname = credentials.usuarioname;
      }
    } else {
      if (credentials.nombre) {
        query.nombre = credentials.nombre;
      }
      var parts;
      if (credentials.email) {
        parts = splitPrincipal(credentials.email, nombreDelimiter);
        query.email = parts[1];
        if (parts[0]) {
          query.nombre = parts[0];
        }
      } else if (credentials.usuarioname) {
        parts = splitPrincipal(credentials.usuarioname, nombreDelimiter);
        query.usuarioname = parts[1];
        if (parts[0]) {
          query.nombre = parts[0];
        }
      }
    }
    return query;
  };

  /**
   * Login a usuario by with the given `credentials`.
   *
   * ```js
   *    Usuario.login({nombre: 'foo', password: 'bar'}, function (err, token) {
   *      console.log(token.id);
   *    });
   * ```
   *
   * If the `emailVerificationRequired` flag is set for the inherited usuario model
   * and the email has not yet been verified then the method will return a 401
   * error that will contain the usuario's id. This id can be used to call the
   * `api/verify` remote method to generate a new email verification token and
   * send back the related email to the usuario.
   *
   * @param {Object} credentials nombre/password or email/password
   * @param {String[]|String} [include] Optionally set it to "usuario" to include
   * the usuario info
   * @callback {Function} callback Callback function
   * @param {Error} err Error object
   * @param {AccessToken} token Access token if login is successful
   * @promise
   */

  Usuario.login = function(credentials, include, fn) {
    var self = this;
    if (typeof include === 'function') {
      fn = include;
      include = undefined;
    }

    fn = fn || utils.createPromiseCallback();

    include = (include || '');
    if (Array.isArray(include)) {
      include = include.map(function(val) {
        return val.toLowerCase();
      });
    } else {
      include = include.toLowerCase();
    }

    var nombreDelimiter;
    // Check if nombre is required
    var nombreRequired = !!(self.settings.nombreRequired ||
      self.settings.nombreDelimiter);
    if (nombreRequired) {
      nombreDelimiter = self.settings.nombreDelimiter;
    }
    var query = self.normalizeCredentials(credentials, nombreRequired,
      nombreDelimiter);

    if (nombreRequired) {
      if (!query.nombre) {
        var err1 = new Error(g.f('{{nombre}} is required'));
        err1.statusCode = 400;
        err1.code = 'NOMBRE_REQUIRED';
        fn(err1);
        return fn.promise;
      } else if (typeof query.nombre !== 'string') {
        var err5 = new Error(g.f('Invalid nombre'));
        err5.statusCode = 400;
        err5.code = 'INVALID_NOMBRE';
        fn(err5);
        return fn.promise;
      }
    }
    if (!query.email && !query.nombre) {
      var err2 = new Error(g.f('{{nombre}} or {{email}} is required'));
      err2.statusCode = 400;
      err2.code = 'NOMBRE_EMAIL_REQUIRED';
      fn(err2);
      return fn.promise;
    }
    if (query.nombre && typeof query.nombre !== 'string') {
      var err3 = new Error(g.f('Invalid nombre'));
      err3.statusCode = 400;
      err3.code = 'INVALID_NOMBRE';
      fn(err3);
      return fn.promise;
    } else if (query.email && typeof query.email !== 'string') {
      var err4 = new Error(g.f('Invalid email'));
      err4.statusCode = 400;
      err4.code = 'INVALID_EMAIL';
      fn(err4);
      return fn.promise;
    }

    self.findOne({where: query}, function(err, usuario) {
      var defaultError = new Error(g.f('login failed'));
      defaultError.statusCode = 401;
      defaultError.code = 'LOGIN_FAILED';

      function tokenHandler(err, token) {
        if (err) return fn(err);
        if (Array.isArray(include) ? include.indexOf('usuario') !== -1 : include === 'usuario') {
          // NOTE(bajtos) We can't set token.usuario here:
          //  1. token.usuario already exists, it's a function injected by
          //     "AccessToken belongsTo Usuario" relation
          //  2. ModelBaseClass.toJSON() ignores own properties, thus
          //     the value won't be included in the HTTP response
          // See also loopback#161 and loopback#162
          token.__data.usuario = usuario;
        }
        fn(err, token);
      }

      if (err) {
        debug('An error is reported from Usuario.findOne: %j', err);
        fn(defaultError);
      } else if (usuario) {
        usuario.hasPassword(credentials.password, function(err, isMatch) {
          if (err) {
            debug('An error is reported from Usuario.hasPassword: %j', err);
            fn(defaultError);
          } else if (isMatch) {
            if (self.settings.emailVerificationRequired && !usuario.emailVerified) {
              // Fail to log in if email verification is not done yet
              debug('Usuario email has not been verified');
              err = new Error(g.f('login failed as the email has not been verified'));
              err.statusCode = 401;
              err.code = 'LOGIN_FAILED_EMAIL_NOT_VERIFIED';
              err.details = {
                usuarioId: usuario.id,
              };
              fn(err);
            } else {
              if (usuario.createAccessToken.length === 2) {
                usuario.createAccessToken(credentials.ttl, tokenHandler);
              } else {
                usuario.createAccessToken(credentials.ttl, credentials, tokenHandler);
              }
            }
          } else {
            debug('The password is invalid for usuario %s', query.email || query.nombre);
            fn(defaultError);
          }
        });
      } else {
        debug('No matching record is found for usuario %s', query.email || query.nombre);
        fn(defaultError);
      }
    });
    return fn.promise;
  };

  /**
   * Logout a usuario with the given accessToken id.
   *
   * ```js
   *    Usuario.logout('asd0a9f8dsj9s0s3223mk', function (err) {
  *      console.log(err || 'Logged out');
  *    });
   * ```
   *
   * @param {String} accessTokenID
   * @callback {Function} callback
   * @param {Error} err
   * @promise
   */

  Usuario.logout = function(tokenId, fn) {
    fn = fn || utils.createPromiseCallback();

    var err;
    if (!tokenId) {
      err = new Error(g.f('{{accessToken}} is required to logout'));
      err.statusCode = 401;
      process.nextTick(fn, err);
      return fn.promise;
    }

    this.relations.accessTokens.modelTo.destroyById(tokenId, function(err, info) {
      if (err) {
        fn(err);
      } else if ('count' in info && info.count === 0) {
        err = new Error(g.f('Could not find {{accessToken}}'));
        err.statusCode = 401;
        fn(err);
      } else {
        fn();
      }
    });
    return fn.promise;
  };

  Usuario.observe('before delete', function(ctx, next) {
    // Do nothing when the access control was disabled for this usuario model.
    if (!ctx.Model.relations.accessTokens) return next();

    var AccessToken = ctx.Model.relations.accessTokens.modelTo;
    var pkName = ctx.Model.definition.idName() || 'id';
    ctx.Model.find({where: ctx.where, fields: [pkName]}, function(err, list) {
      if (err) return next(err);

      var ids = list.map(function(u) { return u[pkName]; });
      ctx.where = {};
      ctx.where[pkName] = {inq: ids};

      AccessToken.destroyAll({usuarioId: {inq: ids}}, next);
    });
  });

  /**
   * Compare the given `password` with the usuarios hashed password.
   *
   * @param {String} password The plain text password
   * @callback {Function} callback Callback function
   * @param {Error} err Error object
   * @param {Boolean} isMatch Returns true if the given `password` matches record
   * @promise
   */

  Usuario.prototype.hasPassword = function(plain, fn) {
    fn = fn || utils.createPromiseCallback();
    if (this.password && plain) {
      bcrypt.compare(plain, this.password, function(err, isMatch) {
        if (err) return fn(err);
        fn(null, isMatch);
      });
    } else {
      fn(null, false);
    }
    return fn.promise;
  };

  /**
   * Change this usuario's password.
   *
   * @param {*} usuarioId Id of the usuario changing the password
   * @param {string} oldPassword Current password, required in order
   *   to strongly verify the identity of the requesting usuario
   * @param {string} newPassword The new password to use.
   * @param {object} [options]
   * @callback {Function} callback
   * @param {Error} err Error object
   * @promise
   */
  Usuario.changePassword = function(usuarioId, oldPassword, newPassword, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    // Make sure to use the constructor of the (sub)class
    // where the method is invoked from (`this` instead of `Usuario`)
    this.findById(usuarioId, options, (err, inst) => {
      if (err) return cb(err);

      if (!inst) {
        const err = new Error(`Usuario ${usuarioId} not found`);
        Object.assign(err, {
          code: 'USUARIO_NOT_FOUND',
          statusCode: 401,
        });
        return cb(err);
      }

      inst.changePassword(oldPassword, newPassword, options, cb);
    });

    return cb.promise;
  };


  Usuario.obtieneCliente = function(cb) {
    var sql = 'SELECT us.id, us.nombre, us.password, us.email, us.estado, rl.id as roleid, rl.name as rol FROM usuario us LEFT JOIN Role rl on us.roleid = rl.id WHERE estado = "Activo"';
    var params = [];
    Usuario.dataSource.connector.query(sql, params, cb)
  };
  // eliminado
  Usuario.obtieneClienteEliminado = function(cb) {
    var sql = 'SELECT us.id, us.nombre, us.password, us.email, us.estado, rl.id as roleid, rl.name as rol FROM usuario us LEFT JOIN Role rl on us.roleid = rl.id WHERE estado = "Eliminado" ';
    var params = [];
    Usuario.dataSource.connector.query(sql, params, cb)
  };

  Usuario.cambiaEstado = function(id, cb) { 
    var sql = 'UPDATE usuario SET estado = "Eliminado" WHERE id = ?'; 
    var params = [id];
    Usuario.dataSource.connector.query(sql, params, cb)
  };
// Eliminado
  Usuario.restableceEstado = function(id, cb) {
    var sql = 'UPDATE usuario SET estado = "Activo" WHERE id = ?'; 
    var params = [id];
    Usuario.dataSource.connector.query(sql, params, cb)
  };



  /**
   * Change this usuario's password (prototype/instance version).
   *
   * @param {string} oldPassword Current password, required in order
   *   to strongly verify the identity of the requesting usuario
   * @param {string} newPassword The new password to use.
   * @param {object} [options]
   * @callback {Function} callback
   * @param {Error} err Error object
   * @promise
   */
  Usuario.prototype.changePassword = function(oldPassword, newPassword, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    this.hasPassword(oldPassword, (err, isMatch) => {
      if (err) return cb(err);
      if (!isMatch) {
        const err = new Error('Invalid current password');
        Object.assign(err, {
          code: 'INVALID_PASSWORD',
          statusCode: 400,
        });
        return cb(err);
      }

      this.setPassword(newPassword, options, cb);
    });
    return cb.promise;
  };

  /**
   * Set this usuario's password after a password-reset request was made.
   *
   * @param {*} usuarioId Id of the usuario changing the password
   * @param {string} newPassword The new password to use.
   * @param {Object} [options] Additional options including remoting context
   * @callback {Function} callback
   * @param {Error} err Error object
   * @promise
   */
  Usuario.setPassword = function(usuarioId, newPassword, options, cb) {
    assert(usuarioId != null && usuarioId !== '', 'usuarioId is a required argument');
    assert(!!newPassword, 'newPassword is a required argument');

    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    // Make sure to use the constructor of the (sub)class
    // where the method is invoked from (`this` instead of `Usuario`)
    this.findById(usuarioId, options, (err, inst) => {
      if (err) return cb(err);

      if (!inst) {
        const err = new Error(`Usuario ${usuarioId} not found`);
        Object.assign(err, {
          code: 'USUARIO_NOT_FOUND',
          statusCode: 401,
        });
        return cb(err);
      }

      inst.setPassword(newPassword, options, cb);
    });

    return cb.promise;
  };

  /**
   * Set this usuario's password. The callers of this method
   * must ensure the client making the request is authorized
   * to change the password, typically by providing the correct
   * current password or a password-reset token.
   *
   * @param {string} newPassword The new password to use.
   * @param {Object} [options] Additional options including remoting context
   * @callback {Function} callback
   * @param {Error} err Error object
   * @promise
   */
  Usuario.prototype.setPassword = function(newPassword, options, cb) {
    assert(!!newPassword, 'newPassword is a required argument');

    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    try {
      this.constructor.validatePassword(newPassword);
    } catch (err) {
      cb(err);
      return cb.promise;
    }

    // We need to modify options passed to patchAttributes, but we don't want
    // to modify the original options object passed to us by setPassword caller
    options = Object.assign({}, options);

    // patchAttributes() does not allow callers to modify the password property
    // unless "options.setPassword" is set.
    options.setPassword = true;

    const delta = {password: newPassword};
    this.patchAttributes(delta, options, (err, updated) => cb(err));

    return cb.promise;
  };

  /**
   * Returns default verification options to use when calling Usuario.prototype.verify()
   * from remote method /usuario/:id/verify.
   *
   * NOTE: the Usuario.getVerifyOptions() method can also be used to ease the
   * building of identity verification options.
   *
   * ```js
   * var verifyOptions = MyUsuario.getVerifyOptions();
   * usuario.verify(verifyOptions);
   * ```
   *
   * This is the full list of possible params, with example values
   *
   * ```js
   * {
   *   type: 'email',
   *   mailer: {
   *     send(verifyOptions, options, cb) {
   *       // send the email
   *       cb(err, result);
   *     }
   *   },
   *   to: 'test@email.com',
   *   from: 'noreply@email.com'
   *   subject: 'verification email subject',
   *   text: 'Please verify your email by opening this link in a web browser',
   *   headers: {'Mime-Version': '1.0'},
   *   template: 'path/to/template.ejs',
   *   templateFn: function(verifyOptions, options, cb) {
   *     cb(null, 'some body template');
   *   }
   *   redirect: '/',
   *   verifyHref: 'http://localhost:3000/api/usuario/confirm',
   *   host: 'localhost'
   *   protocol: 'http'
   *   port: 3000,
   *   restApiRoot= '/api',
   *   generateVerificationToken: function (usuario, options, cb) {
   *     cb(null, 'random-token');
   *   }
   * }
   * ```
   *
   * NOTE: param `to` internally defaults to usuario's email but can be overriden for
   * test purposes or advanced customization.
   *
   * Static default params can be modified in your custom usuario model json definition
   * using `settings.verifyOptions`. Any default param can be programmatically modified
   * like follows:
   *
   * ```js
   * customUsuarioModel.getVerifyOptions = function() {
   *   const base = MyUsuario.base.getVerifyOptions();
   *   return Object.assign({}, base, {
   *     // custom values
   *   });
   * }
   * ```
   *
   * Usually you should only require to modify a subset of these params
   * See `Usuario.verify()` and `Usuario.prototype.verify()` doc for params reference
   * and their default values.
   */

  Usuario.getVerifyOptions = function() {
    const defaultOptions = {
      type: 'email',
      from: 'noreply@example.com',
    };
    return Object.assign({}, this.settings.verifyOptions || defaultOptions);
  };

  /**
   * Verify a usuario's identity by sending them a confirmation message.
   * NOTE: Currently only email verification is supported
   *
   * ```js
   * var verifyOptions = {
   *   type: 'email',
   *   from: 'noreply@example.com'
   *   template: 'verify.ejs',
   *   redirect: '/',
   *   generateVerificationToken: function (usuario, options, cb) {
   *     cb('random-token');
   *   }
   * };
   *
   * usuario.verify(verifyOptions);
   * ```
   *
   * NOTE: the Usuario.getVerifyOptions() method can also be used to ease the
   * building of identity verification options.
   *
   * ```js
   * var verifyOptions = MyUsuario.getVerifyOptions();
   * usuario.verify(verifyOptions);
   * ```
   *
   * @options {Object} verifyOptions
   * @property {String} type Must be `'email'` in the current implementation.
   * @property {Function} mailer A mailer function with a static `.send() method.
   *  The `.send()` method must accept the verifyOptions object, the method's
   *  remoting context options object and a callback function with `(err, email)`
   *  as parameters.
   *  Defaults to provided `usuarioModel.email` function, or ultimately to LoopBack's
   *  own mailer function.
   * @property {String} to Email address to which verification email is sent.
   *  Defaults to usuario's email. Can also be overriden to a static value for test
   *  purposes.
   * @property {String} from Sender email address
   *  For example `'noreply@example.com'`.
   * @property {String} subject Subject line text.
   *  Defaults to `'Thanks for Registering'` or a local equivalent.
   * @property {String} text Text of email.
   *  Defaults to `'Please verify your email by opening this link in a web browser:`
   *  followed by the verify link.
   * @property {Object} headers Email headers. None provided by default.
   * @property {String} template Relative path of template that displays verification
   *  page. Defaults to `'../../templates/verify.ejs'`.
   * @property {Function} templateFn A function generating the email HTML body
   *  from `verify()` options object and generated attributes like `options.verifyHref`.
   *  It must accept the verifyOptions object, the method's remoting context options
   *  object and a callback function with `(err, html)` as parameters.
   *  A default templateFn function is provided, see `createVerificationEmailBody()`
   *  for implementation details.
   * @property {String} redirect Page to which usuario will be redirected after
   *  they verify their email. Defaults to `'/'`.
   * @property {String} verifyHref The link to include in the usuario's verify message.
   *  Defaults to an url analog to:
   *  `http://host:port/restApiRoot/usuarioRestPath/confirm?uid=usuarioId&redirect=/``
   * @property {String} host The API host. Defaults to app's host or `localhost`.
   * @property {String} protocol The API protocol. Defaults to `'http'`.
   * @property {Number} port The API port. Defaults to app's port or `3000`.
   * @property {String} restApiRoot The API root path. Defaults to app's restApiRoot
   *  or `'/api'`
   * @property {Function} generateVerificationToken A function to be used to
   *  generate the verification token.
   *  It must accept the verifyOptions object, the method's remoting context options
   *  object and a callback function with `(err, hexStringBuffer)` as parameters.
   *  This function should NOT add the token to the usuario object, instead simply
   *  execute the callback with the token! Usuario saving and email sending will be
   *  handled in the `verify()` method.
   *  A default token generation function is provided, see `generateVerificationToken()`
   *  for implementation details.
   * @callback {Function} cb Callback function.
   * @param {Object} options remote context options.
   * @param {Error} err Error object.
   * @param {Object} object Contains email, token, uid.
   * @promise
   */

  Usuario.prototype.verify = function(verifyOptions, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    var usuario = this;
    var usuarioModel = this.constructor;
    var registry = usuarioModel.registry;
    verifyOptions = Object.assign({}, verifyOptions);
    // final assertion is performed once all options are assigned
    assert(typeof verifyOptions === 'object',
      'verifyOptions object param required when calling usuario.verify()');

    // Shallow-clone the options object so that we don't override
    // the global default options object
    verifyOptions = Object.assign({}, verifyOptions);

    // Set a default template generation function if none provided
    verifyOptions.templateFn = verifyOptions.templateFn || createVerificationEmailBody;

    // Set a default token generation function if none provided
    verifyOptions.generateVerificationToken = verifyOptions.generateVerificationToken ||
      Usuario.generateVerificationToken;

    // Set a default mailer function if none provided
    verifyOptions.mailer = verifyOptions.mailer || usuarioModel.email ||
      registry.getModelByType(loopback.Email);

    var pkName = usuarioModel.definition.idName() || 'id';
    verifyOptions.redirect = verifyOptions.redirect || '/';
    var defaultTemplate = path.join(__dirname, '..', '..', 'templates', 'verify.ejs');
    verifyOptions.template = path.resolve(verifyOptions.template || defaultTemplate);
    verifyOptions.usuario = usuario;
    verifyOptions.protocol = verifyOptions.protocol || 'http';

    var app = usuarioModel.app;
    verifyOptions.host = verifyOptions.host || (app && app.get('host')) || 'localhost';
    verifyOptions.port = verifyOptions.port || (app && app.get('port')) || 3000;
    verifyOptions.restApiRoot = verifyOptions.restApiRoot || (app && app.get('restApiRoot')) || '/api';

    var displayPort = (
      (verifyOptions.protocol === 'http' && verifyOptions.port == '80') ||
      (verifyOptions.protocol === 'https' && verifyOptions.port == '443')
    ) ? '' : ':' + verifyOptions.port;

    if (!verifyOptions.verifyHref) {
      const confirmMethod = usuarioModel.sharedClass.findMethodByName('confirm');
      if (!confirmMethod) {
        throw new Error(
          'Cannot build usuario verification URL, ' +
          'the default confirm method is not public. ' +
          'Please provide the URL in verifyOptions.verifyHref.'
        );
      }

      const urlPath = joinUrlPath(
        verifyOptions.restApiRoot,
        usuarioModel.http.path,
        confirmMethod.http.path
      );

      verifyOptions.verifyHref =
        verifyOptions.protocol +
        '://' +
        verifyOptions.host +
        displayPort +
        urlPath +
        '?' + qs.stringify({
          uid: '' + verifyOptions.usuario[pkName],
          redirect: verifyOptions.redirect,
        });
    }

    verifyOptions.to = verifyOptions.to || usuario.email;
    verifyOptions.subject = verifyOptions.subject || g.f('Thanks for Registering');
    verifyOptions.headers = verifyOptions.headers || {};

    // assert the verifyOptions params that might have been badly defined
    assertVerifyOptions(verifyOptions);

    // argument "options" is passed depending on verifyOptions.generateVerificationToken function requirements
    var tokenGenerator = verifyOptions.generateVerificationToken;
    if (tokenGenerator.length == 3) {
      tokenGenerator(usuario, options, addTokenToUsuarioAndSave);
    } else {
      tokenGenerator(usuario, addTokenToUsuarioAndSave);
    }

    function addTokenToUsuarioAndSave(err, token) {
      if (err) return cb(err);
      usuario.verificationToken = token;
      usuario.save(options, function(err) {
        if (err) return cb(err);
        sendEmail(usuario);
      });
    }

    // TODO - support more verification types
    function sendEmail(usuario) {
      verifyOptions.verifyHref +=
        verifyOptions.verifyHref.indexOf('?') === -1 ? '?' : '&';
      verifyOptions.verifyHref += 'token=' + usuario.verificationToken;

      verifyOptions.verificationToken = usuario.verificationToken;
      verifyOptions.text = verifyOptions.text || g.f('Please verify your email by opening ' +
        'this link in a web browser:\n\t%s', verifyOptions.verifyHref);
      verifyOptions.text = verifyOptions.text.replace(/\{href\}/g, verifyOptions.verifyHref);

      // argument "options" is passed depending on templateFn function requirements
      var templateFn = verifyOptions.templateFn;
      if (templateFn.length == 3) {
        templateFn(verifyOptions, options, setHtmlContentAndSend);
      } else {
        templateFn(verifyOptions, setHtmlContentAndSend);
      }

      function setHtmlContentAndSend(err, html) {
        if (err) return cb(err);

        verifyOptions.html = html;

        // Remove verifyOptions.template to prevent rejection by certain
        // nodemailer transport plugins.
        delete verifyOptions.template;

        // argument "options" is passed depending on Email.send function requirements
        var Email = verifyOptions.mailer;
        if (Email.send.length == 3) {
          Email.send(verifyOptions, options, handleAfterSend);
        } else {
          Email.send(verifyOptions, handleAfterSend);
        }

        function handleAfterSend(err, email) {
          if (err) return cb(err);
          cb(null, {email: email, token: usuario.verificationToken, uid: usuario[pkName]});
        }
      }
    }

    return cb.promise;
  };

  function assertVerifyOptions(verifyOptions) {
    assert(verifyOptions.type, 'You must supply a verification type (verifyOptions.type)');
    assert(verifyOptions.type === 'email', 'Unsupported verification type');
    assert(verifyOptions.to, 'Must include verifyOptions.to when calling usuario.verify() ' +
      'or the usuario must have an email property');
    assert(verifyOptions.from, 'Must include verifyOptions.from when calling usuario.verify()');
    assert(typeof verifyOptions.templateFn === 'function',
      'templateFn must be a function');
    assert(typeof verifyOptions.generateVerificationToken === 'function',
      'generateVerificationToken must be a function');
    assert(verifyOptions.mailer, 'A mailer function must be provided');
    assert(typeof verifyOptions.mailer.send === 'function', 'mailer.send must be a function ');
  }

  function createVerificationEmailBody(verifyOptions, options, cb) {
    var template = loopback.template(verifyOptions.template);
    var body = template(verifyOptions);
    cb(null, body);
  }

  /**
   * A default verification token generator which accepts the usuario the token is
   * being generated for and a callback function to indicate completion.
   * This one uses the crypto library and 64 random bytes (converted to hex)
   * for the token. When used in combination with the usuario.verify() method this
   * function will be called with the `usuario` object as it's context (`this`).
   *
   * @param {object} usuario The usuario this token is being generated for.
   * @param {object} options remote context options.
   * @param {Function} cb The generator must pass back the new token with this function call.
   */
  Usuario.generateVerificationToken = function(usuario, options, cb) {
    crypto.randomBytes(64, function(err, buf) {
      cb(err, buf && buf.toString('hex'));
    });
  };

  /**
   * Confirm the usuario's identity.
   *
   * @param {Any} usuarioId
   * @param {String} token The validation token
   * @param {String} redirect URL to redirect the usuario to once confirmed
   * @callback {Function} callback
   * @param {Error} err
   * @promise
   */
  Usuario.confirm = function(uid, token, redirect, fn) {
    fn = fn || utils.createPromiseCallback();
    this.findById(uid, function(err, usuario) {
      if (err) {
        fn(err);
      } else {
        if (usuario && usuario.verificationToken === token) {
          usuario.verificationToken = null;
          usuario.emailVerified = true;
          usuario.save(function(err) {
            if (err) {
              fn(err);
            } else {
              fn();
            }
          });
        } else {
          if (usuario) {
            err = new Error(g.f('Invalid token: %s', token));
            err.statusCode = 400;
            err.code = 'INVALID_TOKEN';
          } else {
            err = new Error(g.f('Usuario not found: %s', uid));
            err.statusCode = 404;
            err.code = 'USUARIO_NOT_FOUND';
          }
          fn(err);
        }
      }
    });
    return fn.promise;
  };

  /**
   * Create a short lived access token for temporary login. Allows usuarios
   * to change passwords if forgotten.
   *
   * @options {Object} options
   * @prop {String} email The usuario's email address
   * @property {String} nombre The usuario's nombre (optional)
   * @callback {Function} callback
   * @param {Error} err
   * @promise
   */

  Usuario.resetPassword = function(options, cb) {
    cb = cb || utils.createPromiseCallback();
    var UsuarioModel = this;
    var ttl = UsuarioModel.settings.resetPasswordTokenTTL || DEFAULT_RESET_PW_TTL;
    options = options || {};
    if (typeof options.email !== 'string') {
      var err = new Error(g.f('Email is required'));
      err.statusCode = 400;
      err.code = 'EMAIL_REQUIRED';
      cb(err);
      return cb.promise;
    }

    try {
      if (options.password) {
        UsuarioModel.validatePassword(options.password);
      }
    } catch (err) {
      return cb(err);
    }
    var where = {
      email: options.email,
    };
    if (options.nombre) {
      where.nombre = options.nombre;
    }
    UsuarioModel.findOne({where: where}, function(err, usuario) {
      if (err) {
        return cb(err);
      }
      if (!usuario) {
        err = new Error(g.f('Email not found'));
        err.statusCode = 404;
        err.code = 'EMAIL_NOT_FOUND';
        return cb(err);
      }
      // create a short lived access token for temp login to change password
      // TODO(ritch) - eventually this should only allow password change
      if (UsuarioModel.settings.emailVerificationRequired && !usuario.emailVerified) {
        err = new Error(g.f('Email has not been verified'));
        err.statusCode = 401;
        err.code = 'RESET_FAILED_EMAIL_NOT_VERIFIED';
        return cb(err);
      }

      if (UsuarioModel.settings.restrictResetPasswordTokenScope) {
        const tokenData = {
          ttl: ttl,
          scopes: ['reset-password'],
        };
        usuario.createAccessToken(tokenData, options, onTokenCreated);
      } else {
        // We need to preserve backwards-compatibility with
        // usuario-supplied implementations of "createAccessToken"
        // that may not support "options" argument (we have such
        // examples in our test suite).
        usuario.createAccessToken(ttl, onTokenCreated);
      }

      function onTokenCreated(err, accessToken) {
        if (err) {
          return cb(err);
        }
        cb();
        UsuarioModel.emit('resetPasswordRequest', {
          email: options.email,
          accessToken: accessToken,
          usuario: usuario,
          options: options,
        });
      }
    });

    return cb.promise;
  };

  /*!
   * Hash the plain password
   */
  Usuario.hashPassword = function(plain) {
    this.validatePassword(plain);
    var salt = bcrypt.genSaltSync(this.settings.saltWorkFactor || SALT_WORK_FACTOR);
    return bcrypt.hashSync(plain, salt);
  };

  Usuario.validatePassword = function(plain) {
    var err;
    if (!plain || typeof plain !== 'string') {
      err = new Error(g.f('Invalid password.'));
      err.code = 'INVALID_PASSWORD';
      err.statusCode = 422;
      throw err;
    }

    // Bcrypt only supports up to 72 bytes; the rest is silently dropped.
    var len = Buffer.byteLength(plain, 'utf8');
    if (len > MAX_PASSWORD_LENGTH) {
      err = new Error(g.f('The password entered was too long. Max length is %d (entered %d)',
        MAX_PASSWORD_LENGTH, len));
      err.code = 'PASSWORD_TOO_LONG';
      err.statusCode = 422;
      throw err;
    }
  };

  Usuario._invalidateAccessTokensOfUsuarios = function(usuarioIds, options, cb) {
    if (typeof options === 'function' && cb === undefined) {
      cb = options;
      options = {};
    }

    if (!Array.isArray(usuarioIds) || !usuarioIds.length)
      return process.nextTick(cb);

    var accessTokenRelation = this.relations.accessTokens;
    if (!accessTokenRelation)
      return process.nextTick(cb);

    var AccessToken = accessTokenRelation.modelTo;
    var query = {usuarioId: {inq: usuarioIds}};
    var tokenPK = AccessToken.definition.idName() || 'id';
    if (options.accessToken && tokenPK in options.accessToken) {
      query[tokenPK] = {neq: options.accessToken[tokenPK]};
    }
    // add principalType in AccessToken.query if using polymorphic relations
    // between AccessToken and Usuario
    var relatedUsuario = AccessToken.relations.usuario;
    var isRelationPolymorphic = relatedUsuario && relatedUsuario.polymorphic &&
      !relatedUsuario.modelTo;
    if (isRelationPolymorphic) {
      query.principalType = this.modelName;
    }
    AccessToken.deleteAll(query, options, cb);
  };

  /*!
   * Setup an extended usuario model.
   */

  Usuario.setup = function() {
    // We need to call the base class's setup method
    Usuario.base.setup.call(this);
    var UsuarioModel = this;

    // max ttl
    this.settings.maxTTL = this.settings.maxTTL || DEFAULT_MAX_TTL;
    this.settings.ttl = this.settings.ttl || DEFAULT_TTL;

    UsuarioModel.setter.email = function(value) {
      if (!UsuarioModel.settings.caseSensitiveEmail && typeof value === 'string') {
        this.$email = value.toLowerCase();
      } else {
        this.$email = value;
      }
    };

    UsuarioModel.setter.password = function(plain) {
      if (typeof plain !== 'string') {
        return;
      }
      if ((plain.indexOf('$2a$') === 0 || plain.indexOf('$2b$') === 0) && plain.length === 60) {
        // The password is already hashed. It can be the case
        // when the instance is loaded from DB
        this.$password = plain;
      } else {
        this.$password = this.constructor.hashPassword(plain);
      }
    };

    // Make sure emailVerified is not set by creation
    UsuarioModel.beforeRemote('create', function(ctx, usuario, next) {
      var body = ctx.req.body;
      if (body && body.emailVerified) {
        body.emailVerified = false;
      }
      next();
    });

    UsuarioModel.remoteMethod(
      'login',
      {
        description: 'Login a usuario with nombre/email and password.',
        accepts: [
          {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}},
          {arg: 'include', type: ['string'], http: {source: 'query'},
            description: 'Related objects to include in the response. ' +
            'See the description of return value for more details.'},
        ],
        returns: {
          arg: 'accessToken', type: 'object', root: true,
          description:
            g.f('The response body contains properties of the {{AccessToken}} created on login.\n' +
            'Depending on the value of `include` parameter, the body may contain ' +
            'additional properties:\n\n' +
            '  - `usuario` - `U+007BUsuarioU+007D` - Data of the currently logged in usuario. ' +
            '{{(`include=usuario`)}}\n\n'),
        },
        http: {verb: 'post'},
      }
    );

    UsuarioModel.remoteMethod(
      'logout',
      {
        description: 'Logout a usuario with access token.',
        accepts: [
          {arg: 'access_token', type: 'string', http: function(ctx) {
            var req = ctx && ctx.req;
            var accessToken = req && req.accessToken;
            var tokenID = accessToken ? accessToken.id : undefined;

            return tokenID;
          }, description: 'Do not supply this argument, it is automatically extracted ' +
            'from request headers.',
          },
        ],
        http: {verb: 'all'},
      }
    );

    UsuarioModel.remoteMethod(
      'prototype.verify',
      {
        description: 'Trigger usuario\'s identity verification with configured verifyOptions',
        accepts: [
          {arg: 'verifyOptions', type: 'object', http: ctx => this.getVerifyOptions()},
          {arg: 'options', type: 'object', http: 'optionsFromRequest'},
        ],
        http: {verb: 'post'},
      }
    );

    UsuarioModel.remoteMethod(
      'confirm',
      {
        description: 'Confirm a usuario registration with identity verification token.',
        accepts: [
          {arg: 'uid', type: 'string', required: true},
          {arg: 'token', type: 'string', required: true},
          {arg: 'redirect', type: 'string'},
        ],
        http: {verb: 'get', path: '/confirm'},
      }
    );

    UsuarioModel.remoteMethod(
      'resetPassword',
      {
        description: 'Reset password for a usuario with email.',
        accepts: [
          {arg: 'options', type: 'object', required: true, http: {source: 'body'}},
        ],
        http: {verb: 'post', path: '/reset'},
      }
    );

    UsuarioModel.remoteMethod(
      'changePassword', 
      {
        description: 'Change a usuario\'s password.',
        accepts: [
          {arg: 'id', type: 'any', http: getUsuarioIdFromRequestContext},
          {arg: 'oldPassword', type: 'string', required: true, http: {source: 'form'}},
          {arg: 'newPassword', type: 'string', required: true, http: {source: 'form'}},
          {arg: 'options', type: 'object', http: 'optionsFromRequest'},
        ],
        http: {verb: 'POST', path: '/change-password'},
      }
    );

    UsuarioModel.remoteMethod("obtieneCliente", {
      returns: {
        arg: "Usuario",
        type: "object", root: true
      },
      http: {
        path: "/obtieneUsuario",
        verb: "get" 
      },
      description: [
        'Obtiene los clientes en estado activo',
      ]});

      UsuarioModel.remoteMethod("obtieneClienteEliminado", {
        returns: {
          arg: "Usuario",
          type: "object", root: true
        },
        http: {
          path: "/obtieneUsuarioEliminado",
          verb: "get" 
        },
        description: [
          'Obtiene los usuario en estado eliminado',
        ]});
      
      UsuarioModel.remoteMethod("cambiaEstado", {
        returns: {
          arg: "Usuario",
          type: "object", root: true
        },
        http: {
          path: "/cambiaEstado",
          verb: "put" 
        },
        description: [
          'Cambia estado del usuario a eliminado',
        ],
        accepts: [
          {
            arg: 'id',
            type: 'number',
            required: true,
          },]
      });
      
      UsuarioModel.remoteMethod("restableceEstado", {
        returns: {
          arg: "Usuario",
          type: "object", root: true
        },
        http: {
          path: "/restableceEstado",
          verb: "put" 
        },
        description: [
          'Cambia estado del usuario a activo',
        ],
        accepts: [
          {
            arg: 'id',
            type: 'number',
            required: true,
          },]
      });
      
    

    const setPasswordScopes = UsuarioModel.settings.restrictResetPasswordTokenScope ?
      ['reset-password'] : undefined;

    UsuarioModel.remoteMethod(
      'setPassword',
      {
        description: 'Reset usuario\'s password via a password-reset token.',
        accepts: [
          {arg: 'id', type: 'any', http: getUsuarioIdFromRequestContext},
          {arg: 'newPassword', type: 'string', required: true, http: {source: 'form'}},
          {arg: 'options', type: 'object', http: 'optionsFromRequest'},
        ],
        accessScopes: setPasswordScopes,
        http: {verb: 'POST', path: '/reset-password'},
      }
    );

    function getUsuarioIdFromRequestContext(ctx) {
      const token = ctx.req.accessToken;
      if (!token) return;

      const hasPrincipalType = 'principalType' in token;
      if (hasPrincipalType && token.principalType !== UsuarioModel.modelName) {
        // We have multiple usuario models related to the same access token model
        // and the token used to authorize reset-password request was created
        // for a different usuario model.
        const err = new Error(g.f('Access Denied'));
        err.statusCode = 403;
        throw err;
      }

      return token.usuarioId;
    }

    UsuarioModel.afterRemote('confirm', function(ctx, inst, next) {
      if (ctx.args.redirect !== undefined) {
        if (!ctx.res) {
          return next(new Error(g.f('The transport does not support HTTP redirects.')));
        }
        ctx.res.location(ctx.args.redirect);
        ctx.res.status(302);
      }
      next();
    });

    // default models
    assert(loopback.Email, 'Email model must be defined before Usuario model');
    UsuarioModel.email = loopback.Email;

    assert(loopback.AccessToken, 'AccessToken model must be defined before Usuario model');
    UsuarioModel.accessToken = loopback.AccessToken;

    UsuarioModel.validate('email', emailValidator, {
      message: g.f('Must provide a valid email'),
    });
/*
    // nombre usuarios validation
    if (UsuarioModel.settings.nombreRequired && UsuarioModel.settings.nombreDelimiter) {
      UsuarioModel.validatesUniquenessOf('email', {
        message: 'Email already exists',
        scopedTo: ['email'],
      });
     /* UsuarioModel.validatesUniquenessOf('nombre', {
        message: 'Usuario already exists',
        scopedTo: ['nombre'],
      });
    } else {
      // Regular(Non-nombre) usuarios validation
      UsuarioModel.validatesUniquenessOf('email', {message: 'Email already exists'});
     // UsuarioModel.validatesUniquenessOf('nombre', {message: 'Usuario already exists'});
    }*/

    return UsuarioModel;
  };

  /*!
   * Setup the base usuario.
   */

  Usuario.setup();

  // --- OPERATION HOOKS ---
  //
  // Important: Operation hooks are inherited by subclassed models,
  // therefore they must be registered outside of setup() function

  // Access token to normalize email credentials
  Usuario.observe('access', function normalizeEmailCase(ctx, next) {
    if (!ctx.Model.settings.caseSensitiveEmail && ctx.query.where &&
        ctx.query.where.email && typeof(ctx.query.where.email) === 'string') {
      ctx.query.where.email = ctx.query.where.email.toLowerCase();
    }
    next();
  });

  Usuario.observe('before save', function rejectInsecurePasswordChange(ctx, next) {
    const UsuarioModel = ctx.Model;
    if (!UsuarioModel.settings.rejectPasswordChangesViaPatchOrReplace) {
      // In legacy password flow, any DAO method can change the password
      return next();
    }

    if (ctx.isNewInstance) {
      // The password can be always set when creating a new Usuario instance
      return next();
    }
    const data = ctx.data || ctx.instance;
    const isPasswordChange = 'password' in data;

    // This is the option set by `setPassword()` API
    // when calling `this.patchAttritubes()` to change usuario's password
    if (ctx.options.setPassword) {
      // Verify that only the password is changed and nothing more or less.
      if (Object.keys(data).length > 1 || !isPasswordChange) {
        // This is a programmer's error, use the default status code 500
        return next(new Error(
          'Invalid use of "options.setPassword". Only "password" can be ' +
          'changed when using this option.'
        ));
      }

      return next();
    }

    if (!isPasswordChange) {
      return next();
    }

    const err = new Error(
      'Changing usuario password via patch/replace API is not allowed. ' +
      'Use changePassword() or setPassword() instead.'
    );
    err.statusCode = 401;
    err.code = 'PASSWORD_CHANGE_NOT_ALLOWED';
    next(err);
  });

  Usuario.observe('before save', function prepareForTokenInvalidation(ctx, next) {
    if (ctx.isNewInstance) return next();
    if (!ctx.where && !ctx.instance) return next();

    var pkName = ctx.Model.definition.idName() || 'id';
    var where = ctx.where;
    if (!where) {
      where = {};
      where[pkName] = ctx.instance[pkName];
    }

    ctx.Model.find({where: where}, ctx.options, function(err, usuarioInstances) {
      if (err) return next(err);
      ctx.hookState.originalUsuarioData = usuarioInstances.map(function(u) {
        var usuario = {};
        usuario[pkName] = u[pkName];
        usuario.email = u.email;
        usuario.password = u.password;
        return usuario;
      });
      var emailChanged;
      if (ctx.instance) {
        // Check if map does not return an empty array
        // Fix server crashes when try to PUT a non existent id
        if (ctx.hookState.originalUsuarioData.length > 0) {
          emailChanged = ctx.instance.email !== ctx.hookState.originalUsuarioData[0].email;
        } else {
          emailChanged = true;
        }

        if (emailChanged && ctx.Model.settings.emailVerificationRequired) {
          ctx.instance.emailVerified = false;
        }
      } else if (ctx.data.email) {
        emailChanged = ctx.hookState.originalUsuarioData.some(function(data) {
          return data.email != ctx.data.email;
        });
        if (emailChanged && ctx.Model.settings.emailVerificationRequired) {
          ctx.data.emailVerified = false;
        }
      }

      next();
    });
  });

  Usuario.observe('after save', function invalidateOtherTokens(ctx, next) {
    if (!ctx.instance && !ctx.data) return next();
    if (!ctx.hookState.originalUsuarioData) return next();

    var pkName = ctx.Model.definition.idName() || 'id';
    var newEmail = (ctx.instance || ctx.data).email;
    var newPassword = (ctx.instance || ctx.data).password;

    if (!newEmail && !newPassword) return next();

    if (ctx.options.preserveAccessTokens) return next();

    var usuarioIdsToExpire = ctx.hookState.originalUsuarioData.filter(function(u) {
      return (newEmail && u.email !== newEmail) ||
        (newPassword && u.password !== newPassword);
    }).map(function(u) {
      return u[pkName];
    });
    ctx.Model._invalidateAccessTokensOfUsuarios(usuarioIdsToExpire, ctx.options, next);
  });
};

function emailValidator(err, done) {
  var value = this.email;
  if (value == null)
    return;
  if (typeof value !== 'string')
    return err('string');
  if (value === '') return;
  if (!isEmail.validate(value))
    return err('email');
}

function joinUrlPath(args) {
  var result = arguments[0];
  for (var ix = 1; ix < arguments.length; ix++) {
    var next = arguments[ix];
    result += result[result.length - 1] === '/' && next[0] === '/' ?
      next.slice(1) : next;
  }
  return result;
}


