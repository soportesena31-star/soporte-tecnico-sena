const rateLimit = require('express-rate-limit');
const { ERR_DEMASIADAS_SOLICITUDES } = require('../utils/errorCodes');

const limitarCreacionCasos = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERR_DEMASIADAS_SOLICITUDES,
      message: 'Demasiados casos reportados desde esta red, intenta de nuevo en unos minutos',
    },
  },
});

const limitarOlvidePassword = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERR_DEMASIADAS_SOLICITUDES,
      message: 'Demasiadas solicitudes de restablecimiento, intenta de nuevo en unos minutos',
    },
  },
});

const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERR_DEMASIADAS_SOLICITUDES,
      message: 'Demasiados intentos fallidos de inicio de sesión. Intenta de nuevo en 15 minutos.',
    },
  },
});

module.exports = { limitarCreacionCasos, limitarOlvidePassword, limitarLogin };
