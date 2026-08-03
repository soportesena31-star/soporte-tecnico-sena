const { query } = require('express-validator');

const generarReporteValidator = [
  query('desde')
    .notEmpty().withMessage('Fecha desde es obligatoria')
    .isISO8601().withMessage('Fecha desde inválida'),
  query('hasta')
    .notEmpty().withMessage('Fecha hasta es obligatoria')
    .isISO8601().withMessage('Fecha hasta inválida'),
];

module.exports = { generarReporteValidator };