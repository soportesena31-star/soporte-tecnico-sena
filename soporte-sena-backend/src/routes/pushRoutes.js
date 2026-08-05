const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { suscribir, desuscribir } = require('../controllers/pushController');

const router = express.Router();

router.post(
  '/suscribir',
  requireAuth,
  [
    body('endpoint').trim().notEmpty().withMessage('Endpoint obligatorio').isLength({ max: 500 }),
    body('keys.p256dh').trim().notEmpty().withMessage('Clave p256dh obligatoria').isLength({ max: 255 }),
    body('keys.auth').trim().notEmpty().withMessage('Clave auth obligatoria').isLength({ max: 255 }),
  ],
  validate,
  suscribir,
);

router.post(
  '/desuscribir',
  requireAuth,
  [body('endpoint').trim().notEmpty().withMessage('Endpoint obligatorio').isLength({ max: 500 })],
  validate,
  desuscribir,
);

module.exports = router;
