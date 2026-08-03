const express = require('express');

const router = express.Router();
const { listarUsuarios, actualizarUsuario } = require('../controllers/usuarioController');
const { actualizarUsuarioValidator } = require('../validators/usuarioValidators');
const validate = require('../middleware/validate');
const { requireAuth, requireRol } = require('../middleware/auth');

router.get('/', requireAuth, requireRol('administrador'), listarUsuarios);
router.put('/:id', requireAuth, requireRol('administrador'), actualizarUsuarioValidator, validate, actualizarUsuario);

module.exports = router;
