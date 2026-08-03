const express = require('express');

const router = express.Router();
const { generarReporte, exportarReporte } = require('../controllers/reporteController');
const { requireAuth, requireRol } = require('../middleware/auth');
const { generarReporteValidator } = require('../validators/reporteValidators');
const validate = require('../middleware/validate');

router.get('/', requireAuth, requireRol('administrador'), generarReporteValidator, validate, generarReporte);
router.get('/exportar', requireAuth, requireRol('administrador'), generarReporteValidator, validate, exportarReporte);

module.exports = router;
