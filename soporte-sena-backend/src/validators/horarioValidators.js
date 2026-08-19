const { body, param } = require('express-validator');

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const crearHorarioValidator = [
  body('nombre').trim().isLength({ min: 2, max: 30 }).withMessage('El nombre del turno debe tener entre 2 y 30 caracteres'),
  body('hora_inicio').matches(HORA_REGEX).withMessage('Hora de inicio invalida (formato HH:MM)'),
  body('hora_fin').matches(HORA_REGEX).withMessage('Hora de fin invalida (formato HH:MM)'),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser booleano'),
  body('fijo_sabado').optional().isBoolean().withMessage('El campo fijo_sabado debe ser booleano'),
];

const actualizarHorarioValidator = [
  param('id').isInt({ min: 1 }).withMessage('Id de turno invalido'),
  body('nombre').optional({ values: false }).trim().isLength({ min: 2, max: 30 }).withMessage('El nombre del turno debe tener entre 2 y 30 caracteres'),
  body('hora_inicio').optional().matches(HORA_REGEX).withMessage('Hora de inicio invalida (formato HH:MM)'),
  body('hora_fin').optional().matches(HORA_REGEX).withMessage('Hora de fin invalida (formato HH:MM)'),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser booleano'),
  body('fijo_sabado').optional().isBoolean().withMessage('El campo fijo_sabado debe ser booleano'),
];

const guardarTecnicoSemanaValidator = [
  param('tecnicoId').isInt({ min: 1 }).withMessage('Id de tecnico invalido'),
  body('semana').isISO8601().withMessage('Semana invalida (formato YYYY-MM-DD)'),
  body('dias').isArray({ min: 1, max: 7 }).withMessage('Se requiere la lista de dias de la semana'),
  body('dias.*.dia_semana').isInt({ min: 1, max: 7 }).withMessage('Dia de semana invalido (1=Lunes ... 7=Domingo)'),
  body('dias.*.horario_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Turno invalido'),
  body('dias.*.descanso').optional().isBoolean().withMessage('El campo descanso debe ser booleano'),
];

module.exports = { crearHorarioValidator, actualizarHorarioValidator, guardarTecnicoSemanaValidator };