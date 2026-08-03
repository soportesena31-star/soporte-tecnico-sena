const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');
const { ERR_VALIDATION } = require('../utils/errorCodes');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, ERR_VALIDATION, 'Datos invalidos', errors.array());
  }
  next();
}

module.exports = validate;
