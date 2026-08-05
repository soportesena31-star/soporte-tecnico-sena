const { PushSuscripcion } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { ERR_VALIDATION, ERR_NOT_FOUND } = require('../utils/errorCodes');

// Guarda la suscripcion Web Push del dispositivo del usuario logueado.
// Si ya existia el mismo endpoint (mismo dispositivo), se actualiza en vez
// de duplicar (la clave UNIQUE lo garantiza con upsert).
async function suscribir(req, res, next) {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return errorResponse(res, 400, ERR_VALIDATION, 'Suscripcion incompleta (endpoint y claves obligatorias)');
    }

    const userAgent = (req.headers['user-agent'] || '').slice(0, 255);

    const [registro] = await PushSuscripcion.findOrCreate({
      where: { endpoint },
      defaults: {
        usuario_id: req.usuario.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
      },
    });

    // El endpoint ya existia y pertenecia a otro usuario (cambio de cuenta):
    // actualizamos el dueno.
    if (registro.usuario_id !== req.usuario.id) {
      await registro.update({
        usuario_id: req.usuario.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
      });
    }

    return successResponse(res, 200, { suscrito: true }, 'Dispositivo suscrito a alertas');
  } catch (err) {
    next(err);
  }
}

async function desuscribir(req, res, next) {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return errorResponse(res, 400, ERR_VALIDATION, 'El endpoint es obligatorio');
    }
    const registro = await PushSuscripcion.findOne({ where: { endpoint } });
    if (!registro) {
      return successResponse(res, 200, { suscrito: false }, 'No habia suscripcion');
    }
    await registro.destroy();
    return successResponse(res, 200, { suscrito: false }, 'Dispositivo desuscrito');
  } catch (err) {
    next(err);
  }
}

module.exports = { suscribir, desuscribir };
