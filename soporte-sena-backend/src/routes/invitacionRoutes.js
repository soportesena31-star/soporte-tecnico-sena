const express = require('express');

const router = express.Router();
const {
  crearInvitacion, verInvitacion, aceptarInvitacion,
} = require('../controllers/invitacionController');
const {
  crearInvitacionValidator, aceptarInvitacionValidator,
} = require('../validators/invitacionValidators');
const validate = require('../middleware/validate');
const { requireAuth, requireRol } = require('../middleware/auth');

router.post('/', requireAuth, requireRol('administrador'), crearInvitacionValidator, validate, crearInvitacion);
router.get('/:token', verInvitacion);
router.post('/:token/aceptar', aceptarInvitacionValidator, validate, aceptarInvitacion);

module.exports = router;
