const express = require('express');

const router = express.Router();
const {
  listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria,
} = require('../controllers/categoriaController');
const { requireAuth, requireRol } = require('../middleware/auth');
const {
  crearCategoriaValidator,
  actualizarCategoriaValidator,
  eliminarCategoriaValidator,
} = require('../validators/categoriaValidators');
const validate = require('../middleware/validate');

// Público — sin login, usado desde el formulario QR
router.get('/', listarCategorias);

// Solo administrador puede gestionar categorías
router.post('/', requireAuth, requireRol('administrador'), crearCategoriaValidator, validate, crearCategoria);
router.put('/:id', requireAuth, requireRol('administrador'), actualizarCategoriaValidator, validate, actualizarCategoria);
router.delete('/:id', requireAuth, requireRol('administrador'), eliminarCategoriaValidator, validate, eliminarCategoria);

module.exports = router;
