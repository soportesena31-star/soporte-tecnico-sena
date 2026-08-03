const express = require('express');

const router = express.Router();
const {
  crearCaso, consultarPorNumero, listarCasos, tomarCaso, asignarCaso, iniciarCaso, agregarNota, resolverCaso, reabrirCaso,
} = require('../controllers/casoController');
const { crearCasoValidator, resolverCasoValidator, asignarCasoValidator } = require('../validators/casoValidators');
const validate = require('../middleware/validate');
const { requireAuth, requireRol } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { limitarCreacionCasos } = require('../middleware/rateLimiter');

// Publicas — sin login, es lo que usa el formulario que abre el QR unico
// El formulario puede enviar varias fotos con el campo 'fotos_novedad'
// Acepta tanto 'fotos_novedad' (múltiples) como 'foto_novedad' (antiguo, único)
router.post('/', limitarCreacionCasos, upload.fields([
  { name: 'fotos_novedad', maxCount: 3 },
  { name: 'foto_novedad', maxCount: 1 },
]), crearCasoValidator, validate, crearCaso);
router.get('/consultar/:numero_caso', consultarPorNumero);

// Requieren sesion de tecnico o administrador
router.get('/', requireAuth, listarCasos);
router.post('/:id/tomar', requireAuth, tomarCaso);
router.post('/:id/asignar', requireAuth, requireRol('administrador'), asignarCasoValidator, validate, asignarCaso);
router.post('/:id/iniciar', requireAuth, iniciarCaso);
router.post('/:id/notas', requireAuth, agregarNota);
// Resolver caso: permitir 1-5 archivos de evidencia con campo 'foto_evidencia'
router.post('/:id/resolver', requireAuth, upload.array('foto_evidencia', 5), resolverCasoValidator, validate, resolverCaso);
router.post('/:id/reabrir', requireAuth, reabrirCaso);

module.exports = router;
