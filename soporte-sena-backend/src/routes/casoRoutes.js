const express = require('express');

const router = express.Router();
const {
  crearCaso, consultarPorNumero, listarCasos, tomarCaso, asignarCaso, reasignarCaso, iniciarCaso, agregarNota, resolverCaso, cerrarCaso, reabrirCaso,
} = require('../controllers/casoController');
const { crearCasoValidator, resolverCasoValidator, asignarCasoValidator, reasignarCasoValidator } = require('../validators/casoValidators');
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
// Reasignacion: la puede ejecutar el tecnico asignado al caso o un administrador
// (la autorizacion fina se valida en el controlador).
router.post('/:id/reasignar', requireAuth, reasignarCasoValidator, validate, reasignarCaso);
router.post('/:id/iniciar', requireAuth, iniciarCaso);
router.post('/:id/notas', requireAuth, agregarNota);
// Resolver caso: el frontend envia las fotos como 'fotos_evidencia' y el texto
// 'notas_resolucion'. Con upload.fields se aceptan ambos y el texto va en req.body
// (upload.array rechaza cualquier campo adicional -> MulterError "Unexpected field").
router.post('/:id/resolver', requireAuth, upload.fields([
  { name: 'foto_evidencia', maxCount: 5 },
  { name: 'fotos_evidencia', maxCount: 5 },
]), resolverCasoValidator, validate, resolverCaso);
// Cerrar y reabrir son decisiones administrativas (cierran o reactivan un caso
// ya resuelto): solo el administrador puede ejecutarlas.
router.post('/:id/cerrar', requireAuth, requireRol('administrador'), cerrarCaso);
router.post('/:id/reabrir', requireAuth, requireRol('administrador'), reabrirCaso);

module.exports = router;
