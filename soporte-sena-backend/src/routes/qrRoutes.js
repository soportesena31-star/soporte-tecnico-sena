const express = require('express');

const router = express.Router();
const { generarQr } = require('../controllers/qrController');
const { requireAuth, requireRol } = require('../middleware/auth');

router.get('/', requireAuth, requireRol('administrador'), generarQr);

module.exports = router;
