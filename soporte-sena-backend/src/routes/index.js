const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/espacios', require('./espacioRoutes'));
router.use('/categorias', require('./categoriaRoutes'));
router.use('/casos', require('./casoRoutes'));
router.use('/usuarios', require('./usuarioRoutes'));
router.use('/historial', require('./historialRoutes'));
router.use('/reportes', require('./reporteRoutes'));
router.use('/invitaciones', require('./invitacionRoutes'));
router.use('/roles', require('./roleRoutes'));
router.use('/qr', require('./qrRoutes'));
router.use('/configuracion', require('./configuracionRoutes'));
router.use('/push', require('./pushRoutes'));
router.use('/horarios', require('./horarioRoutes'));

module.exports = router;
