const { Configuracion } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { ERR_VALIDATION } = require('../utils/errorCodes');

const CAMPOS_BOOLEAN = [
  'notificar_nuevo_caso',
  'notificar_asignacion',
  'notificar_resolucion',
  'notificar_email',
  'asignacion_automatica',
];

const DEFAULTS = {
  notificar_nuevo_caso: true,
  notificar_asignacion: true,
  notificar_resolucion: false,
  notificar_email: true,
  asignacion_automatica: false,
};

// Carga la configuracion (una fila). Si aun no existe, devuelve los valores
// por defecto sin crear nada.
async function obtenerConfiguracionFila() {
  const fila = await Configuracion.findOne({ where: { id: 1 } });
  if (fila) return fila;
  return { id: 1, ...DEFAULTS };
}

async function obtenerConfiguracion(req, res, next) {
  try {
    const config = await obtenerConfiguracionFila();
    return successResponse(res, 200, config);
  } catch (err) {
    next(err);
  }
}

async function actualizarConfiguracion(req, res, next) {
  try {
    const body = req.body || {};
    const cambios = {};

    for (const campo of CAMPOS_BOOLEAN) {
      if (campo in body) {
        if (typeof body[campo] !== 'boolean') {
          return errorResponse(res, 400, ERR_VALIDATION, `El campo ${campo} debe ser true/false`);
        }
        cambios[campo] = body[campo];
      }
    }

    // Si no viene ningun campo valido, nada que guardar
    if (Object.keys(cambios).length === 0) {
      return successResponse(res, 200, await obtenerConfiguracionFila(), 'Sin cambios');
    }

    const [fila] = await Configuracion.findOrCreate({
      where: { id: 1 },
      defaults: { id: 1, ...DEFAULTS },
    });
    await fila.update(cambios);

    const actualizada = await Configuracion.findByPk(1);
    return successResponse(res, 200, actualizada, 'Configuración actualizada');
  } catch (err) {
    next(err);
  }
}

module.exports = { obtenerConfiguracion, actualizarConfiguracion };