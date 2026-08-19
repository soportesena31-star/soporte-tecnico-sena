const { body, param } = require('express-validator');

const TIPOS_VALIDOS = ['aula', 'laboratorio', 'auditorio', 'oficina', 'zona_comun', 'otro'];

const crearEspacioValidator = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre del espacio es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre es demasiado largo'),
  body('tipo')
    .isIn(TIPOS_VALIDOS)
    .withMessage('Tipo de espacio inválido'),
  body('sede')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('La sede es demasiado larga'),
  body('estado')
    .optional({ checkFalsy: true })
    .isIn(['activo', 'inactivo'])
    .withMessage('Estado de espacio inválido'),
];

const actualizarEspacioValidator = [
  param('id').isInt({ min: 1 }).withMessage('Id de espacio inválido'),
  body('nombre')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty().withMessage('El nombre del espacio no puede estar vacío')
    .isLength({ max: 100 }).withMessage('El nombre es demasiado largo'),
  body('tipo')
    .optional({ checkFalsy: true })
    .isIn(TIPOS_VALIDOS)
    .withMessage('Tipo de espacio inválido'),
  body('sede')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('La sede es demasiado larga'),
  body('estado')
    .optional({ checkFalsy: true })
    .isIn(['activo', 'inactivo'])
    .withMessage('Estado de espacio inválido'),
];

module.exports = { crearEspacioValidator, actualizarEspacioValidator };