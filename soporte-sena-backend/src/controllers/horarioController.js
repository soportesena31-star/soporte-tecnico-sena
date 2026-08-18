const { sequelize, Horario, HorarioTecnico, Usuario, Role } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/response');
const { ERR_NOT_FOUND, ERR_VALIDATION } = require('../utils/errorCodes');

// El sabado lo cubren minimo 1 y maximo 2 tecnicos (regla del panel de
// horarios). El minimo se avisa en el frontend (cobertura); aqui se hace
// cumplir el maximo para que la semana nunca quede con 3+ tecnicos el sabado.
const MAX_TECNICOS_SABADO = 2;
const DIA_SABADO = 6;

async function listarHorarios(req, res, next) {
  try {
    const horarios = await Horario.findAll({ order: [['hora_inicio', 'ASC'], ['nombre', 'ASC']] });
    return successResponse(res, 200, horarios);
  } catch (err) {
    next(err);
  }
}

async function crearHorario(req, res, next) {
  try {
    const { nombre, hora_inicio, hora_fin, activo } = req.body;
    const horario = await Horario.create({
      nombre,
      hora_inicio,
      hora_fin,
      activo: activo !== undefined ? activo : true,
    });
    return successResponse(res, 201, horario, 'Turno creado');
  } catch (err) {
    next(err);
  }
}

async function actualizarHorario(req, res, next) {
  try {
    const horario = await Horario.findByPk(req.params.id);
    if (!horario) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Turno no encontrado');
    }

    const { nombre, hora_inicio, hora_fin, activo } = req.body;
    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (hora_inicio !== undefined) cambios.hora_inicio = hora_inicio;
    if (hora_fin !== undefined) cambios.hora_fin = hora_fin;
    if (activo !== undefined) cambios.activo = !!activo;

    await horario.update(cambios);
    return successResponse(res, 200, horario, 'Turno actualizado');
  } catch (err) {
    next(err);
  }
}

// Grilla completa de la semana: una fila por (tecnico, dia) ya guardado.
// El frontend arma la matriz tecnicos x dias y detecta los dias sin definir.
async function obtenerGrilla(req, res, next) {
  try {
    const { semana } = req.query;
    if (!semana || !/^\d{4}-\d{2}-\d{2}$/.test(semana)) {
      return errorResponse(res, 400, ERR_VALIDATION, 'Parametro semana invalido (formato YYYY-MM-DD)');
    }

    const filas = await HorarioTecnico.findAll({
      where: { semana },
      include: [
        { model: Usuario, as: 'tecnico', attributes: ['id', 'nombre'] },
        { model: Horario, as: 'horario', attributes: ['id', 'nombre', 'hora_inicio', 'hora_fin'] },
      ],
      order: [['tecnico_id', 'ASC'], ['dia_semana', 'ASC']],
    });

    const grilla = filas.map((f) => ({
      tecnico_id: f.tecnico_id,
      tecnico_nombre: f.tecnico?.nombre || null,
      dia_semana: f.dia_semana,
      horario_id: f.horario_id,
      horario_nombre: f.horario?.nombre || null,
      hora_inicio: f.horario?.hora_inicio || null,
      hora_fin: f.horario?.hora_fin || null,
      descanso: f.descanso,
    }));

    return successResponse(res, 200, { semana, grilla });
  } catch (err) {
    next(err);
  }
}

// Guarda (o reemplaza) la semana de UN tecnico. El payload trae los dias
// completos L-D; los dias que no vengan se eliminan para esa semana/tecnico,
// asi el guardado es idempotente y el panel puede editar celda por celda.
async function guardarTecnicoSemana(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const tecnico = await Usuario.findByPk(req.params.tecnicoId, {
      include: [{ model: Role, as: 'rol' }],
      transaction,
    });
    if (!tecnico || tecnico.rol?.nombre !== 'tecnico') {
      await transaction.rollback();
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Tecnico no encontrado');
    }

    const { semana, dias } = req.body;

    // Normaliza cada dia: descanso o turno (nunca ambos).
    const normalizados = dias.map((d) => {
      // El dia de descanso es entre semana: un "descanso" en sabado se trata como sin definir.
      const descanso = d.descanso === true && d.dia_semana !== DIA_SABADO;
      return {
        tecnico_id: tecnico.id,
        dia_semana: d.dia_semana,
        semana,
        horario_id: descanso ? null : d.horario_id || null,
        descanso,
      };
    });

    // Valida que los turnos existan y esten activos.
    const idsTurnos = [...new Set(normalizados.filter((n) => n.horario_id).map((n) => n.horario_id))];
    if (idsTurnos.length > 0) {
      const turnos = await Horario.findAll({ where: { id: idsTurnos }, transaction });
      const turnosPorId = new Map(turnos.map((t) => [t.id, t]));
      for (const id of idsTurnos) {
        const t = turnosPorId.get(id);
        if (!t) {
          await transaction.rollback();
          return errorResponse(res, 400, ERR_VALIDATION, 'Uno de los turnos asignados no existe');
        }
        if (!t.activo) {
          await transaction.rollback();
          return errorResponse(res, 400, ERR_VALIDATION, `El turno ${t.nombre} esta desactivado`);
        }
      }
    }

    // Regla del sabado: maximo 2 tecnicos trabajando ese dia en la misma semana.
    const sabado = normalizados.find((n) => n.dia_semana === DIA_SABADO && n.horario_id);
    if (sabado) {
      const ocupantesSabado = await HorarioTecnico.count({
        where: {
          semana,
          dia_semana: DIA_SABADO,
          horario_id: { [Op.ne]: null },
          tecnico_id: { [Op.ne]: tecnico.id },
        },
        transaction,
      });
      if (ocupantesSabado >= MAX_TECNICOS_SABADO) {
        await transaction.rollback();
        return errorResponse(
          res, 409, ERR_VALIDATION,
          `El sabado ya tiene ${MAX_TECNICOS_SABADO} tecnicos asignados (maximo permitido)`,
        );
      }
    }

    // Reemplaza la semana del tecnico (idempotente). Los dias sin contenido
    // (sin turno y sin descanso, es decir "sin definir") no generan registro.
    await HorarioTecnico.destroy({ where: { tecnico_id: tecnico.id, semana }, transaction });
    const conContenido = normalizados.filter((n) => n.horario_id || n.descanso);
    if (conContenido.length > 0) {
      await HorarioTecnico.bulkCreate(conContenido, { transaction });
    }

    await transaction.commit();

    const filas = await HorarioTecnico.findAll({
      where: { tecnico_id: tecnico.id, semana },
      include: [{ model: Horario, as: 'horario', attributes: ['id', 'nombre'] }],
      order: [['dia_semana', 'ASC']],
    });

    return successResponse(res, 200, {
      semana,
      tecnico_id: tecnico.id,
      dias: filas.map((f) => ({
        dia_semana: f.dia_semana,
        horario_id: f.horario_id,
        horario_nombre: f.horario?.nombre || null,
        descanso: f.descanso,
      })),
    }, 'Horario guardado');
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
}

module.exports = { listarHorarios, crearHorario, actualizarHorario, obtenerGrilla, guardarTecnicoSemana };