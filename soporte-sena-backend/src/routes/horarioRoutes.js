const express = require('express');

const router = express.Router();
const {
  listarHorarios, crearHorario, actualizarHorario, obtenerGrilla, guardarTecnicoSemana,
  obtenerMiSemana,
} = require('../controllers/horarioController');
const {
  crearHorarioValidator, actualizarHorarioValidator, guardarTecnicoSemanaValidator,
} = require('../validators/horarioValidators');
const validate = require('../middleware/validate');
const { requireAuth, requireRol } = require('../middleware/auth');

// Panel de horarios: todo el CRUD es del administrador. El tecnico no
// consulta horarios por ahora (solo el panel admin los administra).
// Ojo con el orden: '/tecnicos' va ANTES de '/:id' para que Express no
// lo capture como un id de turno.
router.get('/', requireAuth, requireRol('administrador'), listarHorarios);
router.post('/', requireAuth, requireRol('administrador'), crearHorarioValidator, validate, crearHorario);
router.put('/:id', requireAuth, requireRol('administrador'), actualizarHorarioValidator, validate, actualizarHorario);
router.get('/tecnicos', requireAuth, requireRol('administrador'), obtenerGrilla);
router.put('/tecnicos/:tecnicoId', requireAuth, requireRol('administrador'), guardarTecnicoSemanaValidator, validate, guardarTecnicoSemana);
// Perfil del tecnico: su propia semana (cualquier usuario autenticado ve la suya).
router.get('/mi-semana', requireAuth, obtenerMiSemana);

module.exports = router;