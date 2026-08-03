const { Role } = require('../models');
const { successResponse } = require('../utils/response');

async function listarRoles(req, res, next) {
  try {
    const roles = await Role.findAll({ order: [['nombre', 'ASC']] });
    return successResponse(res, 200, roles);
  } catch (err) {
    next(err);
  }
}

module.exports = { listarRoles };
