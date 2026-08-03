const { body } = require('express-validator');

const crearCasoValidator = [
  body('reportado_por')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 150 }).withMessage('El nombre es demasiado largo'),
  body('espacio_id')
    .isInt({ min: 1 }).withMessage('Debes seleccionar un espacio'),
  body('categoria_id')
    .isInt({ min: 1 }).withMessage('Debes seleccionar una categoria'),
  body('descripcion')
    .trim()
    .notEmpty().withMessage('Describe la novedad')
    .isLength({ max: 1000 }).withMessage('La descripcion es demasiado larga'),
];

const resolverCasoValidator = [
  body('notas_resolucion')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('La nota es demasiado larga'),
];

const asignarCasoValidator = [
  body('tecnico_id')
    .isInt({ min: 1 }).withMessage('Debes seleccionar un tecnico'),
];

module.exports = { crearCasoValidator, resolverCasoValidator, asignarCasoValidator };
