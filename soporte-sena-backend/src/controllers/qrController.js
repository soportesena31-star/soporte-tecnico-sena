const QRCode = require('qrcode');
const { successResponse, errorResponse } = require('../utils/response');
const { ERR_VALIDATION } = require('../utils/errorCodes');

function obtenerUrlDestino() {
  return process.env.FRONTEND_URL;
}

async function generarQr(req, res, next) {
  try {
    const url = obtenerUrlDestino();
    if (!url) {
      return errorResponse(res, 500, ERR_VALIDATION, 'FRONTEND_URL no esta configurada en el servidor');
    }

    if (req.query.formato === 'png') {
      const buffer = await QRCode.toBuffer(url, {
        type: 'png',
        width: 1024,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition', 'attachment; filename="qr-soporte-sena.png"');
      return res.send(buffer);
    }

    const dataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return successResponse(res, 200, { dataUrl, url });
  } catch (err) {
    next(err);
  }
}

module.exports = { generarQr };
