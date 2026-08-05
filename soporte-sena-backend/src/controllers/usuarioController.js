const { Usuario, Caso, Role } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const {
  ERR_NOT_FOUND, ERR_VALIDATION, ERR_USUARIO_YA_EXISTE,
} = require('../utils/errorCodes');

async function listarUsuarios(req, res, next) {
  try {
    const { rol } = req.query;
    const includeRol = { model: Role, as: 'rol', attributes: ['id', 'nombre'] };
    if (rol) includeRol.where = { nombre: rol };

    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'email', 'especialidad', 'activo', 'createdAt'],
      include: [includeRol],
      order: [['nombre', 'ASC']],
    });

    // Se agrega el conteo de casos resueltos por cada usuario, util para el
    // ranking de rendimiento que muestra el panel de administrador
    const conteos = await Caso.findAll({
      where: { estado: 'resuelto' },
      attributes: ['tecnico_id'],
      raw: true,
    });
    const porTecnico = conteos.reduce((acc, c) => {
      if (!c.tecnico_id) return acc;
      acc[c.tecnico_id] = (acc[c.tecnico_id] || 0) + 1;
      return acc;
    }, {});

    const usuariosConConteo = usuarios.map((u) => ({
      ...u.toJSON(),
      casosResueltos: porTecnico[u.id] || 0,
    }));

    return successResponse(res, 200, usuariosConConteo);
  } catch (err) {
    next(err);
  }
}

async function actualizarUsuario(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Usuario no encontrado');
    }

    const { nombre, email, especialidad, rol_id, activo } = req.body;

    if (email !== undefined && email !== usuario.email) {
      const duplicado = await Usuario.findOne({ where: { email } });
      if (duplicado) {
        return errorResponse(res, 400, ERR_USUARIO_YA_EXISTE, 'Ya existe un usuario con ese correo');
      }
    }

    if (activo === false && String(req.usuario.id) === String(req.params.id)) {
      return errorResponse(res, 400, ERR_VALIDATION, 'No puedes desactivar tu propia cuenta');
    }

    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (email !== undefined) cambios.email = email;
    if (especialidad !== undefined) cambios.especialidad = especialidad || null;
    if (activo !== undefined) cambios.activo = !!activo;

    if (rol_id !== undefined) {
      const rol = await Role.findByPk(rol_id);
      if (!rol) {
        return errorResponse(res, 400, ERR_VALIDATION, 'Rol invalido');
      }
      cambios.rol_id = rol_id;
    }

    await usuario.update(cambios);

    const actualizado = await Usuario.findByPk(usuario.id, {
      include: [{ model: Role, as: 'rol' }],
    });

    return successResponse(res, 200, actualizado, 'Usuario actualizado');
  } catch (err) {
    next(err);
  }
}

// Lista breve de tecnicos activos: la usan los tecnicos para reasignar casos.
// A diferencia de listarUsuarios (solo administrador), aqui basta con estar
// autenticado; se omiten datos sensibles (email, conteos).
async function listarTecnicos(req, res, next) {
  try {
    const tecnicos = await Usuario.findAll({
      attributes: ['id', 'nombre'],
      where: { activo: true },
      include: [{ model: Role, as: 'rol', where: { nombre: 'tecnico' }, required: true, attributes: [] }],
      order: [['nombre', 'ASC']],
    });
    return successResponse(res, 200, tecnicos);
  } catch (err) {
    next(err);
  }
}

module.exports = { listarUsuarios, listarTecnicos, actualizarUsuario };
