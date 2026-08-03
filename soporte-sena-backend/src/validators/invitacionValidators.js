const { body } = require('express-validator');

const crearInvitacionValidator = [
  body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 100 }),
  body('rol_id').isInt({ min: 1 }).withMessage('Debes seleccionar un rol'),
];

const aceptarInvitacionValidator = [
  body('password').isLength({ min: 8 }).withMessage('La contrasena debe tener al menos 8 caracteres'),
];

module.exports = { crearInvitacionValidator, aceptarInvitacionValidator };
