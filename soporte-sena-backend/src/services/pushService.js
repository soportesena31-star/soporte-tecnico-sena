const webpush = require('web-push');
const logger = require('../config/logger');
const { PushSuscripcion, Usuario, Role } = require('../models');

// VAPID: identifica a la aplicacion ante el servicio de push del navegador.
// Se generan una vez (npx web-push generate-vapid-keys) y viven en Railway.
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:soportesena31@gmail.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const PUSH_ACTIVO = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);

/**
 * Envia una notificacion push a las suscripciones de los usuarios con los
 * roles indicados (ej. tecnico, administrador). Las suscripciones vencidas
 * (404/410) se eliminan para no acumular basura. Nunca lanza: las fallas se
 * registran y se siguen intentando los demas dispositivos.
 */
async function notificarRoles(rolesPermitidos, payload) {
  if (!PUSH_ACTIVO) {
    logger.warn('Push desactivado: faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
    return;
  }
  try {
    const suscripciones = await PushSuscripcion.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        required: true,
        include: [{ model: Role, as: 'rol' }],
      }],
    });

    const objetivo = suscripciones.filter((s) => {
      const rol = s.usuario?.rol?.nombre;
      return rol && rolesPermitidos.includes(rol);
    });

    if (objetivo.length === 0) return;

    const cuerpo = JSON.stringify(payload);

    for (const s of objetivo) {
      try {
        await webpush.sendNotification({
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        }, cuerpo, { TTL: 60 });
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // La suscripcion ya no existe: el dispositivo se desuscribio o expiro.
          await s.destroy().catch(() => {});
          logger.info('Suscripcion push vencida, eliminada', { id: s.id });
        } else {
          logger.error('Error enviando push', { statusCode: err.statusCode, message: err.message });
        }
      }
    }
  } catch (err) {
    logger.error('Error en notificarRoles', { message: err.message });
  }
}

module.exports = { notificarRoles, PUSH_ACTIVO };
