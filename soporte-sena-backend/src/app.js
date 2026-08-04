const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { ERR_NOT_FOUND } = require('./utils/errorCodes');

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
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: ERR_NOT_FOUND, message: 'Ruta no encontrada' } });
});

app.use(errorHandler);

module.exports = app;
