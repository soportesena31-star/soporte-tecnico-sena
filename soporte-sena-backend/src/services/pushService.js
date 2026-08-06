const webpush = require('web-push');
const logger = require('../config/logger');
const { PushSuscripcion, Usuario, Role, Caso } = require('../models');

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
 * Cantidad de casos en estado 'abierto' (sin atender) para el badge del
 * icono de la app. Tecnicos y administradores ven el mismo conteo.
 */
async function contarPendientes() {
  return Caso.count({ where: { estado: 'abierto' } });
}

/**
 * Ruta de la app a la que lleva la notificacion al tocarla, segun el rol del
 * destinatario: el tecnico va a su vista del caso y el administrador al panel
 * con el detalle del caso abierto (?caso=). Se resuelve por suscripcion para
 * que un mismo push apunte a la ruta correcta para cada quien.
 */
function urlDestinoCaso(usuario, numeroCaso) {
  if (!numeroCaso) return '/';
  const rol = usuario?.rol?.nombre;
  if (rol === 'administrador') return `/admin?caso=${encodeURIComponent(numeroCaso)}`;
  return `/casos/${encodeURIComponent(numeroCaso)}`;
}

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

    // Todos los destinatarios reciben el mismo conteo para el badge.
    const pendientes = await contarPendientes().catch(() => 0);
    const numeroCaso = payload?.data?.numero_caso;

    for (const s of objetivo) {
      const data = { ...(payload.data || {}), url: urlDestinoCaso(s.usuario, numeroCaso) };
      const cuerpo = JSON.stringify({ ...payload, data, pendientes });
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

/**
 * Envia una notificacion push SOLO a los dispositivos de un usuario
 * especifico (ej. el tecnico al que se le reasigno un caso).
 * Nunca lanza: las fallas se registran y las suscripciones vencidas se limpian.
 */
async function notificarUsuario(usuarioId, payload) {
  if (!PUSH_ACTIVO) return;
  try {
    const usuario = await Usuario.findByPk(usuarioId, { include: [{ model: Role, as: 'rol' }] });
    const suscripciones = await PushSuscripcion.findAll({ where: { usuario_id: usuarioId } });
    if (suscripciones.length === 0) return;

    const pendientes = await contarPendientes().catch(() => 0);
    const numeroCaso = payload?.data?.numero_caso;

    for (const s of suscripciones) {
      const data = { ...(payload.data || {}), url: urlDestinoCaso(usuario, numeroCaso) };
      const cuerpo = JSON.stringify({ ...payload, data, pendientes });
      try {
        await webpush.sendNotification({
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        }, cuerpo, { TTL: 60 });
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await s.destroy().catch(() => {});
          logger.info('Suscripcion push vencida, eliminada', { id: s.id });
        } else {
          logger.error('Error enviando push a usuario', { usuario_id: usuarioId, statusCode: err.statusCode, message: err.message });
        }
      }
    }
  } catch (err) {
    logger.error('Error en notificarUsuario', { message: err.message });
  }
}

module.exports = { notificarRoles, notificarUsuario, PUSH_ACTIVO };
