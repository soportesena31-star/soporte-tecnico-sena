const { Resend } = require('resend');
const logger = require('../config/logger');

let resendClient = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

async function enviarCorreo({ to, subject, html }) {
  const client = getClient();
  const from = process.env.RESEND_FROM_EMAIL || 'Soporte SENA <onboarding@resend.dev>';

  if (!client) {
    logger.warn('RESEND_API_KEY no configurada: el correo no se envio de verdad, solo queda en el log', {
      to, subject, preview: html.replace(/<[^>]+>/g, ' ').slice(0, 200),
    });
    return { enviado: false, motivo: 'RESEND_API_KEY no configurada' };
  }

  try {
    const { data, error } = await client.emails.send({
      from, to, subject, html,
    });
    if (error) {
      logger.error('Resend devolvio un error al enviar el correo', { to, subject, error });
      return { enviado: false, motivo: error.message || 'Error de Resend' };
    }
    logger.info('Correo enviado via Resend', { to, subject, id: data?.id });
    return { enviado: true, id: data?.id };
  } catch (err) {
    logger.error('Fallo la llamada a Resend', { to, subject, error: err.message });
    return { enviado: false, motivo: err.message };
  }
}

function plantillaInvitacion({ nombre, rolNombre, link }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <div style="background:#39A900; padding: 24px; text-align:center; border-radius: 12px 12px 0 0;">
        <h1 style="color:#fff; margin:0; font-size: 20px;">SENA Soporte Técnico</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Hola${nombre ? ` ${nombre}` : ''},</p>
        <p>Fuiste invitado a unirte al sistema de soporte técnico del SENA como <strong>${rolNombre}</strong>.</p>
        <p>Para activar tu cuenta y crear tu contraseña, entra al siguiente enlace (valido por 48 horas):</p>
        <p style="text-align:center; margin: 24px 0;">
          <a href="${link}" style="background:#39A900; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">Activar mi cuenta</a>
        </p>
        <p style="font-size:12px; color:#6b7280;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
      </div>
    </div>`;
}

function plantillaRestablecimiento({ nombre, link }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <div style="background:#1B2A4A; padding: 24px; text-align:center; border-radius: 12px 12px 0 0;">
        <h1 style="color:#fff; margin:0; font-size: 20px;">SENA Soporte Técnico</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Hola${nombre ? ` ${nombre}` : ''},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace vence en 1 hora:</p>
        <p style="text-align:center; margin: 24px 0;">
          <a href="${link}" style="background:#1B2A4A; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">Restablecer contraseña</a>
        </p>
        <p style="font-size:12px; color:#6b7280;">Si no solicitaste esto, puedes ignorar este correo — tu contraseña actual sigue siendo válida.</p>
      </div>
    </div>`;
}

async function enviarInvitacion({
  email, nombre, rolNombre, link,
}) {
  return enviarCorreo({
    to: email,
    subject: 'Invitación a Soporte Técnico SENA',
    html: plantillaInvitacion({ nombre, rolNombre, link }),
  });
}

async function enviarRestablecimiento({ email, nombre, link }) {
  return enviarCorreo({
    to: email,
    subject: 'Restablecer contraseña — Soporte Técnico SENA',
    html: plantillaRestablecimiento({ nombre, link }),
  });
}

module.exports = { enviarInvitacion, enviarRestablecimiento };
