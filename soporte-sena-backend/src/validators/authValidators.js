const { body } = require('express-validator');

const loginValidator = [
  body('email').isEmail().withMessage('Email invalido'),
  body('password').notEmpty().withMessage('La contrasena es obligatoria'),
];

const olvidePasswordValidator = [
  body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
];

const restablecerPasswordValidator = [
  body('token').notEmpty().withMessage('Token requerido'),
  body('password').isLength({ min: 8 }).withMessage('La contrasena debe tener al menos 8 caracteres'),
];

module.exports = { loginValidator, olvidePasswordValidator, restablecerPasswordValidator };
