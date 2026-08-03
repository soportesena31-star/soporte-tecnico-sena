// Script de prueba manual para el modulo de correo (Resend).
// No toca la base de datos ni levanta el servidor: solo prueba que
// RESEND_API_KEY este bien configurada y que los correos lleguen.
//
// Uso:
//   1. Ajusta CORREO_DESTINO abajo con el correo al que quieres que llegue la prueba.
//      (Si usas el remitente de prueba onboarding@resend.dev, Resend solo te
//      dejara enviar al correo con el que creaste tu cuenta de Resend.)
//   2. Desde la carpeta soporte-sena-backend, corre:
//        node test-mailer.js invitacion
//      o
//        node test-mailer.js reset
//
require('dotenv').config();
const { enviarInvitacion, enviarRestablecimiento } = require('./src/utils/mailer');

const CORREO_DESTINO = 'soportesena31@gmail.com'; // <-- cambia esto

async function main() {
  const tipo = process.argv[2] || 'invitacion';

  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY no esta configurada en el .env. El correo no se enviara de verdad.');
  }

  let resultado;
  if (tipo === 'reset') {
    resultado = await enviarRestablecimiento({
      email: CORREO_DESTINO,
      nombre: 'Usuario de prueba',
      link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer/token-de-prueba`,
    });
  } else {
    resultado = await enviarInvitacion({
      email: CORREO_DESTINO,
      nombre: 'Usuario de prueba',
      rolNombre: 'Instructor',
      link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitacion/token-de-prueba`,
    });
  }

  console.log('Resultado:', resultado);
  if (resultado.enviado) {
    console.log('Listo: revisa la bandeja de entrada (o spam) de', CORREO_DESTINO);
  } else {
    console.log('No se envio. Motivo:', resultado.motivo);
  }
}

main().catch((err) => {
  console.error('Error inesperado al probar el correo:', err);
  process.exit(1);
});