const express = require('express');

const router = express.Router();
const { listarRoles } = require('../controllers/roleController');
const { requireAuth, requireRol } = require('../middleware/auth');

router.get('/', requireAuth, requireRol('administrador'), listarRoles);

module.exports = router;
