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
 * Conteo de casos pendientes por usuario, para el badge del icono de la app:
 * - administrador: casos en estado 'abierto' (por atender/asignar).
 * - tecnico: casos asignados a el en abierto/asignado/en_proceso.
 */
async function contarPendientes() {
  const casos = await Caso.findAll({
    attributes: ['estado', 'tecnico_id'],
    where: { estado: ['abierto', 'asignado', 'en_proceso'] },
  });
  const porTecnico = new Map();
  let abiertos = 0;
  for (const c of casos) {
    if (c.estado === 'abierto') abiertos += 1;
    if (c.tecnico_id) porTecnico.set(c.tecnico_id, (porTecnico.get(c.tecnico_id) || 0) + 1);
  }
  return { abiertos, porTecnico };
}

function pendientesDe(pendientes, usuario) {
  const rol = usuario?.rol?.nombre;
  if (rol === 'administrador') return pendientes.abiertos;
  if (rol === 'tecnico') return pendientes.porTecnico.get(usuario.id) || 0;
  return 0;
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

    // Cada usuario recibe su propio conteo de pendientes para el badge.
    const pendientes = await contarPendientes().catch(() => null);

    const porUsuario = new Map();
    for (const s of objetivo) {
      if (!porUsuario.has(s.usuario.id)) porUsuario.set(s.usuario.id, { usuario: s.usuario, suscripciones: [] });
      porUsuario.get(s.usuario.id).suscripciones.push(s);
    }

    for (const { usuario, suscripciones: subs } of porUsuario.values()) {
      const cuerpo = JSON.stringify({
        ...payload,
        pendientes: pendientes ? pendientesDe(pendientes, usuario) : 0,
      });
      for (const s of subs) {
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
    const suscripciones = await PushSuscripcion.findAll({ where: { usuario_id: usuarioId } });
    if (suscripciones.length === 0) return;

    const usuario = await Usuario.findByPk(usuarioId, { include: [{ model: Role, as: 'rol' }] });
    const pendientes = await contarPendientes().catch(() => null);
    const cuerpo = JSON.stringify({
      ...payload,
      pendientes: pendientes ? pendientesDe(pendientes, usuario) : 0,
    });

    for (const s of suscripciones) {
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
