const jwt = require('jsonwebtoken');
const { Usuario, Role, TokenAcceso } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { ERR_CREDENCIALES_INVALIDAS, ERR_TOKEN_INVALIDO, ERR_CORREO_NO_REGISTRADO, ERR_CORREO_NO_ENVIADO } = require('../utils/errorCodes');
const { generarToken, hashearToken } = require('../utils/tokens');
const { enviarRestablecimiento } = require('../utils/mailer');

const HORAS_EXPIRACION_RESET = 1;

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({
      where: { email },
      include: [{ model: Role, as: 'rol' }],
    });

    if (!usuario || !usuario.activo || !(await usuario.validarPassword(password))) {
      return errorResponse(res, 401, ERR_CREDENCIALES_INVALIDAS, 'Email o contrasena incorrectos');
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '12h' },
    );

    return successResponse(res, 200, { token, usuario }, 'Sesion iniciada');
  } catch (err) {
    next(err);
  }
}

async function perfil(req, res) {
  return successResponse(res, 200, req.usuario);
}

async function olvidePassword(req, res, next) {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario || !usuario.activo) {
      return errorResponse(res, 404, ERR_CORREO_NO_REGISTRADO,
        'Este correo no pertenece a ningún técnico o administrador del sistema');
    }

    const { token, hash } = generarToken();
    const expira = new Date(Date.now() + HORAS_EXPIRACION_RESET * 60 * 60 * 1000);

    await TokenAcceso.create({
      tipo: 'restablecimiento',
      email,
      usuario_id: usuario.id,
      token_hash: hash,
      expira_at: expira,
    });

    const link = `${process.env.FRONTEND_URL}/restablecer/${token}`;
    const resultado = await enviarRestablecimiento({ email, nombre: usuario.nombre, link });

    if (!resultado.enviado) {
      return errorResponse(res, 500, ERR_CORREO_NO_ENVIADO,
        'No se pudo enviar el correo de restablecimiento. Intenta de nuevo en unos minutos');
    }

    return successResponse(res, 200, null, 'Te enviamos las instrucciones a tu correo');
  } catch (err) {
    next(err);
  }
}

async function restablecerPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const hash = hashearToken(token);
    const registro = await TokenAcceso.findOne({ where: { token_hash: hash, tipo: 'restablecimiento' } });

    if (!registro || registro.estaUsado() || registro.haExpirado()) {
      return errorResponse(res, 404, ERR_TOKEN_INVALIDO, 'Este enlace no es valido o ya vencio');
    }

    const usuario = await Usuario.findByPk(registro.usuario_id);
    if (!usuario) {
      return errorResponse(res, 404, ERR_TOKEN_INVALIDO, 'Este enlace no es valido o ya vencio');
    }

    usuario.password_hash = password;
    await usuario.save();

    await registro.update({ usado_at: new Date() });
    // Cualquier otro reset pendiente para este usuario queda invalidado:
    // un enlace viejo filtrado no debe seguir sirviendo despues de este cambio.
    await TokenAcceso.update(
      { usado_at: new Date() },
      { where: { usuario_id: usuario.id, tipo: 'restablecimiento', usado_at: null } },
    );

    return successResponse(res, 200, null, 'Contrasena actualizada');
  } catch (err) {
    next(err);
  }
}

async function cambiarPassword(req, res, next) {
  try {
    const { password_actual, password_nueva } = req.body;
    if (!password_actual || !password_nueva) {
      return errorResponse(res, 400, 'ERR_VALIDATION', 'Se requieren la contraseña actual y la nueva');
    }
    if (password_nueva.length < 6) {
      return errorResponse(res, 400, 'ERR_VALIDATION', 'La contraseña nueva debe tener al menos 6 caracteres');
    }
    const usuario = await Usuario.findByPk(req.usuario.id);
    const esValida = await usuario.validarPassword(password_actual);
    if (!esValida) {
      return errorResponse(res, 401, ERR_CREDENCIALES_INVALIDAS, 'La contraseña actual es incorrecta');
    }
    // El hook beforeUpdate de Usuario.js hashea automáticamente si password_hash cambia
    usuario.password_hash = password_nueva;
    await usuario.save();
    return successResponse(res, 200, null, 'Contraseña actualizada correctamente');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login, perfil, olvidePassword, restablecerPassword, cambiarPassword,
};
