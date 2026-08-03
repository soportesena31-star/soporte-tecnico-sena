const { body, param } = require('express-validator');

const crearCategoriaValidator = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre de la categoría es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre es demasiado largo'),
  body('prioridad_sugerida')
    .optional({ checkFalsy: true })
    .isIn(['baja', 'media', 'alta']).withMessage('Prioridad inválida. Usa: baja, media o alta'),
];

const actualizarCategoriaValidator = [
  param('id').isInt({ min: 1 }).withMessage('Id de categoría inválido'),
  body('nombre')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 100 }).withMessage('El nombre es demasiado largo'),
  body('prioridad_sugerida')
    .optional({ checkFalsy: true })
    .isIn(['baja', 'media', 'alta']).withMessage('Prioridad inválida. Usa: baja, media o alta'),
];

const eliminarCategoriaValidator = [
  param('id').isInt({ min: 1 }).withMessage('Id de categoría inválido'),
];

module.exports = { crearCategoriaValidator, actualizarCategoriaValidator, eliminarCategoriaValidator };