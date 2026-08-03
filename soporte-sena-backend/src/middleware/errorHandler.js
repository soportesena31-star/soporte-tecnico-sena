const logger = require('../config/logger');
const { errorResponse } = require('../utils/response');
const { ERR_SERVER, ERR_VALIDATION } = require('../utils/errorCodes');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const detalles = err.errors ? err.errors.map((e) => e.message) : null;
    return errorResponse(res, 400, ERR_VALIDATION, 'Datos invalidos', detalles);
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || ERR_SERVER;
  const message = err.statusCode ? err.message : 'Ocurrio un error inesperado en el servidor';

  return errorResponse(res, statusCode, errorCode, message);
}

class AppError extends Error {
  constructor(statusCode, errorCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

module.exports = { errorHandler, AppError };
