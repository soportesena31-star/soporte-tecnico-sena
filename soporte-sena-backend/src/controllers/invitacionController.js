const jwt = require('jsonwebtoken');
const {
  TokenAcceso, Usuario, Role, sequelize,
} = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { generarToken, hashearToken } = require('../utils/tokens');
const { enviarInvitacion } = require('../utils/mailer');
const {
  ERR_VALIDATION, ERR_USUARIO_YA_EXISTE, ERR_TOKEN_INVALIDO,
} = require('../utils/errorCodes');

const HORAS_EXPIRACION_INVITACION = 48;

async function crearInvitacion(req, res, next) {
  try {
    const { email, nombre, rol_id } = req.body;

    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      return errorResponse(res, 409, ERR_USUARIO_YA_EXISTE, 'Ya existe una cuenta con ese correo');
    }

    const rol = await Role.findByPk(rol_id);
    if (!rol) {
      return errorResponse(res, 400, ERR_VALIDATION, 'Rol no valido');
    }

    const { token, hash } = generarToken();
    const expira = new Date(Date.now() + HORAS_EXPIRACION_INVITACION * 60 * 60 * 1000);

    await TokenAcceso.create({
      tipo: 'invitacion',
      email,
      token_hash: hash,
      rol_id,
      nombre_invitado: nombre,
      expira_at: expira,
    });

    const link = `${process.env.FRONTEND_URL}/invitacion/${token}`;
    const resultado = await enviarInvitacion({
      email, nombre, rolNombre: rol.nombre, link,
    });

    return successResponse(res, 201, {
      email,
      correo_enviado: resultado.enviado,
      motivo: resultado.enviado ? undefined : resultado.motivo,
    }, resultado.enviado ? 'Invitacion enviada' : 'Invitacion creada, pero el correo no se pudo enviar');
  } catch (err) {
    next(err);
  }
}

async function verInvitacion(req, res, next) {
  try {
    const hash = hashearToken(req.params.token);
    const registro = await TokenAcceso.findOne({
      where: { token_hash: hash, tipo: 'invitacion' },
      include: [{ model: Role, as: 'rolPropuesto', attributes: ['id', 'nombre'] }],
    });

    if (!registro || registro.estaUsado() || registro.haExpirado()) {
      return errorResponse(res, 404, ERR_TOKEN_INVALIDO, 'Esta invitacion no es valida o ya vencio');
    }

    return successResponse(res, 200, {
      email: registro.email,
      nombre: registro.nombre_invitado,
      rol: registro.rolPropuesto.nombre,
    });
  } catch (err) {
    next(err);
  }
}

async function aceptarInvitacion(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const hash = hashearToken(req.params.token);
    const registro = await TokenAcceso.findOne({
      where: { token_hash: hash, tipo: 'invitacion' },
      transaction: t,
    });

    if (!registro || registro.estaUsado() || registro.haExpirado()) {
      await t.rollback();
      return errorResponse(res, 404, ERR_TOKEN_INVALIDO, 'Esta invitacion no es valida o ya vencio');
    }

    const usuario = await Usuario.create({
      nombre: registro.nombre_invitado,
      email: registro.email,
      password_hash: req.body.password,
      rol_id: registro.rol_id,
    }, { transaction: t });

    await registro.update({ usado_at: new Date(), usuario_id: usuario.id }, { transaction: t });
    await t.commit();

    const usuarioConRol = await Usuario.findByPk(usuario.id, { include: [{ model: Role, as: 'rol' }] });
    const token = jwt.sign({ id: usuario.id, rol: usuarioConRol.rol.nombre }, process.env.JWT_SECRET, { expiresIn: '12h' });

    return successResponse(res, 201, { token, usuario: usuarioConRol }, 'Cuenta activada');
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

module.exports = { crearInvitacion, verInvitacion, aceptarInvitacion };
