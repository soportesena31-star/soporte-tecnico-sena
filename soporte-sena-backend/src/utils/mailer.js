const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

async function enviarCorreo({ to, subject, html }) {
  const tr = getTransporter();
  if (!tr) {
    logger.warn('SMTP no configurado: el correo no se envio de verdad, solo queda en el log', {
      to, subject, preview: html.replace(/<[^>]+>/g, ' ').slice(0, 200),
    });
    return { enviado: false, motivo: 'SMTP no configurado' };
  }

  const remitente = process.env.SMTP_FROM || process.env.SMTP_USER;
  const from = { name: 'Soporte Técnico SENA', address: remitente };

  try {
    const info = await tr.sendMail({ from, to, subject, html });
    logger.info('Correo enviado via SMTP', { to, subject, id: info.messageId });
    return { enviado: true, id: info.messageId };
  } catch (err) {
    logger.error('Fallo el envio por SMTP', { to, subject, error: err.message });
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
