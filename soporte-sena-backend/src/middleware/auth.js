const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');
const { ERR_UNAUTHORIZED, ERR_FORBIDDEN } = require('../utils/errorCodes');
const { Usuario, Role } = require('../models');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return errorResponse(res, 401, ERR_UNAUTHORIZED, 'Token no proporcionado');
    }
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(payload.id, {
      include: [{ model: Role, as: 'rol' }],
    });
    if (!usuario || !usuario.activo) {
      return errorResponse(res, 401, ERR_UNAUTHORIZED, 'Usuario no valido');
    }
    req.usuario = usuario;
    next();
  } catch (err) {
    return errorResponse(res, 401, ERR_UNAUTHORIZED, 'Token invalido o expirado');
  }
}

function requireRol(...roles) {
  return (req, res, next) => {
    const nombreRol = req.usuario?.rol?.nombre;
    if (!nombreRol || !roles.includes(nombreRol)) {
      return errorResponse(res, 403, ERR_FORBIDDEN, 'No tienes permiso para esta accion');
    }
    next();
  };
}

module.exports = { requireAuth, requireRol };
