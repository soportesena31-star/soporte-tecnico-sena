const express = require('express');

const router = express.Router();
const {
  login, perfil, olvidePassword, restablecerPassword, cambiarPassword,
} = require('../controllers/authController');
const {
  loginValidator, olvidePasswordValidator, restablecerPasswordValidator,
} = require('../validators/authValidators');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { limitarOlvidePassword, limitarLogin } = require('../middleware/rateLimiter');

router.post('/login', limitarLogin, loginValidator, validate, login);
router.get('/perfil', requireAuth, perfil);
router.post('/olvide-password', limitarOlvidePassword, olvidePasswordValidator, validate, olvidePassword);
router.post('/restablecer-password', restablecerPasswordValidator, validate, restablecerPassword);
router.put('/cambiar-password', requireAuth, cambiarPassword);

module.exports = router;
