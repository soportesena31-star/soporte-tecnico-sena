const express = require('express');

const router = express.Router();
const { listarHistorialGlobal, exportarHistorial } = require('../controllers/historialController');
const { requireAuth, requireRol } = require('../middleware/auth');

router.get('/', requireAuth, requireRol('administrador'), listarHistorialGlobal);
router.get('/exportar', requireAuth, requireRol('administrador'), exportarHistorial);

module.exports = router;
