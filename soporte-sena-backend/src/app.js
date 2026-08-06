const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { ERR_NOT_FOUND, ERR_UNAUTHORIZED, ERR_FORBIDDEN } = require('./utils/errorCodes');
const { suscribir: suscribirSSE } = require('./services/eventBus');

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

// Stream SSE en tiempo real (alertas de casos nuevos). Los paneles abiertos
// se conectan aqui; si el navegador lo cierra, se limpia solo. El token que
// envia el panel se valida y solo el personal (tecnico/administrador) puede
// conectarse: sin token valido el stream devuelve 401 y no abre la conexion.
app.get('/api/eventos', (req, res) => {
  const token = String(req.query.token || '');
  let payload = null;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      error: { code: ERR_UNAUTHORIZED, message: 'Token invalido o vencido' },
    });
  }
  if (!['tecnico', 'administrador'].includes(payload.rol)) {
    return res.status(403).json({
      success: false,
      error: { code: ERR_FORBIDDEN, message: 'Sin permiso para este stream' },
    });
  }

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
