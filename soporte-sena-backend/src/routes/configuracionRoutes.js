const express = require('express');

const router = express.Router();
const {
  obtenerConfiguracion, actualizarConfiguracion,
} = require('../controllers/configuracionController');
const { requireAuth, requireRol } = require('../middleware/auth');

// Solo el administrador puede leer y modificar la configuracion del sistema
router.get('/', requireAuth, requireRol('administrador'), obtenerConfiguracion);
router.put('/', requireAuth, requireRol('administrador'), actualizarConfiguracion);

module.exports = router;