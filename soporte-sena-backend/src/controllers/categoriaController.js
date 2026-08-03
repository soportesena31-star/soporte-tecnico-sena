const { Categoria } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { ERR_NOT_FOUND, ERR_VALIDATION } = require('../utils/errorCodes');

const PRIORIDADES_VALIDAS = ['baja', 'media', 'alta'];

async function listarCategorias(req, res, next) {
  try {
    const categorias = await Categoria.findAll({ order: [['nombre', 'ASC']] });
    return successResponse(res, 200, categorias);
  } catch (err) {
    next(err);
  }
}

async function crearCategoria(req, res, next) {
  try {
    const { nombre, prioridad_sugerida = 'media' } = req.body;
    if (!nombre || !nombre.trim()) {
      return errorResponse(res, 400, ERR_VALIDATION, 'El nombre de la categoría es obligatorio');
    }
    if (!PRIORIDADES_VALIDAS.includes(prioridad_sugerida)) {
      return errorResponse(res, 400, ERR_VALIDATION, 'Prioridad inválida. Usa: baja, media o alta');
    }
    const categoria = await Categoria.create({
      nombre: nombre.trim(),
      prioridad_sugerida,
    });
    return successResponse(res, 201, categoria, 'Categoría creada');
  } catch (err) {
    // Código de unicidad de MySQL/Sequelize
    if (err.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 409, ERR_VALIDATION, 'Ya existe una categoría con ese nombre');
    }
    next(err);
  }
}

async function actualizarCategoria(req, res, next) {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Categoría no encontrada');
    }
    const { nombre, prioridad_sugerida } = req.body;
    if (nombre !== undefined && !nombre.trim()) {
      return errorResponse(res, 400, ERR_VALIDATION, 'El nombre no puede estar vacío');
    }
    if (prioridad_sugerida !== undefined && !PRIORIDADES_VALIDAS.includes(prioridad_sugerida)) {
      return errorResponse(res, 400, ERR_VALIDATION, 'Prioridad inválida. Usa: baja, media o alta');
    }
    await categoria.update({
      ...(nombre !== undefined && { nombre: nombre.trim() }),
      ...(prioridad_sugerida !== undefined && { prioridad_sugerida }),
    });
    return successResponse(res, 200, categoria, 'Categoría actualizada');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 409, ERR_VALIDATION, 'Ya existe una categoría con ese nombre');
    }
    next(err);
  }
}

async function eliminarCategoria(req, res, next) {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Categoría no encontrada');
    }
    await categoria.destroy();
    return successResponse(res, 200, null, 'Categoría eliminada');
  } catch (err) {
    // No se puede eliminar si tiene casos asociados (FK constraint)
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return errorResponse(res, 409, ERR_VALIDATION, 'No se puede eliminar una categoría que tiene casos asociados');
    }
    next(err);
  }
}

module.exports = { listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria };
