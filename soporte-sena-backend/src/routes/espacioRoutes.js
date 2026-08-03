const express = require('express');

const router = express.Router();
const { listarEspacios, crearEspacio, actualizarEspacio } = require('../controllers/espacioController');
const { requireAuth, requireRol } = require('../middleware/auth');
const { crearEspacioValidator, actualizarEspacioValidator } = require('../validators/espacioValidators');
const validate = require('../middleware/validate');

// Publica: alimenta el selector de espacio en el formulario de reporte
router.get('/', listarEspacios);

router.post('/', requireAuth, requireRol('administrador'), crearEspacioValidator, validate, crearEspacio);
router.put('/:id', requireAuth, requireRol('administrador'), actualizarEspacioValidator, validate, actualizarEspacio);

module.exports = router;
