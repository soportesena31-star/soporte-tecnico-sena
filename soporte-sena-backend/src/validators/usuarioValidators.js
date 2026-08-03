const { body } = require('express-validator');

const actualizarUsuarioValidator = [
  body('nombre').optional().trim().isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('email').optional().isEmail().withMessage('Email invalido').normalizeEmail(),
  body('especialidad').optional({ values: true }).trim(),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser booleano'),
  body('rol_id').optional().isInt({ min: 1 }).withMessage('Rol invalido'),
];

module.exports = { actualizarUsuarioValidator };