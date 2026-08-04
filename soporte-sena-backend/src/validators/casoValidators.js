const { body } = require('express-validator');

const crearCasoValidator = [
  body('reportado_por')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 150 }).withMessage('El nombre es demasiado largo'),
  // Un caso se ubica por espacio registrado O por una ubicacion personalizada
  // (el formulario tiene la opcion "Otra ubicacion (No listada)").
  // espacio_id deja de ser obligatorio si viene ubicacion_personalizada;
  // la coherencia entre ambas se valida en el controlador.
  body('espacio_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Debes seleccionar un espacio'),
  body('ubicacion_personalizada')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('La ubicacion es demasiado larga'),
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
