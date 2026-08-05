const express = require('express');

const router = express.Router();
const { listarUsuarios, listarTecnicos, actualizarUsuario } = require('../controllers/usuarioController');
const { actualizarUsuarioValidator } = require('../validators/usuarioValidators');
const validate = require('../middleware/validate');
const { requireAuth, requireRol } = require('../middleware/auth');

// Tecnicos activos para reasignacion: cualquier sesion valida (tecnico o admin)
router.get('/tecnicos', requireAuth, listarTecnicos);
router.get('/', requireAuth, requireRol('administrador'), listarUsuarios);
router.put('/:id', requireAuth, requireRol('administrador'), actualizarUsuarioValidator, validate, actualizarUsuario);

module.exports = router;
