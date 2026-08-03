const { Op } = require('sequelize');
const { Espacio } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { ERR_NOT_FOUND } = require('../utils/errorCodes');

async function listarEspacios(req, res, next) {
  try {
    const { tipo, busqueda } = req.query;
    const where = { estado: 'activo' };
    if (tipo) where.tipo = tipo;
    if (busqueda) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { codigo: { [Op.like]: `%${busqueda}%` } },
      ];
    }
    const espacios = await Espacio.findAll({ where, order: [['nombre', 'ASC']] });
    return successResponse(res, 200, espacios);
  } catch (err) {
    next(err);
  }
}

async function crearEspacio(req, res, next) {
  try {
    const espacio = await Espacio.create(req.body);
    return successResponse(res, 201, espacio, 'Espacio creado');
  } catch (err) {
    next(err);
  }
}

async function actualizarEspacio(req, res, next) {
  try {
    const espacio = await Espacio.findByPk(req.params.id);
    if (!espacio) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Espacio no encontrado');
    }
    await espacio.update(req.body);
    return successResponse(res, 200, espacio, 'Espacio actualizado');
  } catch (err) {
    next(err);
  }
}

module.exports = { listarEspacios, crearEspacio, actualizarEspacio };
