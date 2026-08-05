const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const net = require('node:net');
const dns = require('node:dns');

require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { ERR_NOT_FOUND } = require('./utils/errorCodes');
const { suscribir: suscribirSSE } = require('./services/eventBus');
const { requireAuth, requireRol } = require('./middleware/auth');

const app = express();

// Railway (y la mayoria de PaaS) terminan TLS en su proxy y reenvian la peticion
// con 'X-Forwarded-For'. Sin esto, express-rate-limit lanza
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR y bloquea las rutas limitadas en produccion.
app.set('trust proxy', 1);

// Seguridad HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permite cargar imágenes desde frontend local/producción
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

// CORS Estricto sin desbordamiento
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('No permitido por la política CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Límite de payload para evitar DoS por JSON excesivo
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

app.use(morgan('dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// TEMPORAL (diagnostico SMTP): prueba DNS y TCP hacia el host SMTP desde
// dentro del contenedor. Se elimina cuando se resuelva el envio de correos.
function probarTcp(host, port, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const fin = (resultado) => { socket.destroy(); resolve(resultado); };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => fin({ ok: true }));
    socket.once('timeout', () => fin({ ok: false, error: 'timeout' }));
    socket.once('error', (e) => fin({ ok: false, error: `${e.code || ''} ${e.message}` }));
    socket.connect(port, host);
  });
}

app.get('/api/_diagnostico/smtp', requireAuth, requireRol('administrador'), async (req, res) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const lookup = (family) => new Promise((resolve) => {
    dns.lookup(host, { family, all: true }, (e, a) => resolve(e ? e.message : a));
  });
  const puertos = {};
  for (const puerto of [465, 587, 443]) {
    puertos[puerto] = await probarTcp(host, puerto);
  }
  res.json({ host, dnsV4: await lookup(4), dnsV6: await lookup(6), puertos });
});

// Stream SSE en tiempo real (alertas de casos nuevos). Los paneles abiertos
// se conectan aqui; si el navegador lo cierra, se limpia solo.
app.get('/api/eventos', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`event: conectado\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  const cerrar = suscribirSSE(res);
  req.on('close', cerrar);
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: ERR_NOT_FOUND, message: 'Ruta no encontrada' } });
});

app.use(errorHandler);

module.exports = app;
