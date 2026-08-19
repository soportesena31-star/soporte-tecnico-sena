const { sequelize, Horario, HorarioTecnico, Usuario, Role } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/response');
const { ERR_NOT_FOUND, ERR_VALIDATION } = require('../utils/errorCodes');

// El sabado lo cubren minimo 1 y maximo 2 tecnicos con el turno fijo de
// sabado (fijo_sabado=true en el catalogo, por defecto el 8-4). Aqui se hace
// cumplir la regla completa: (a) el unico turno asignable al sabado es el
// fijo, (b) como maximo 2 tecnicos trabajan ese dia. El minimo se avisa en
// el frontend (cobertura).
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
  const transaction = await sequelize.transaction();
  try {
    const { nombre, hora_inicio, hora_fin, activo, fijo_sabado } = req.body;

    // Solo puede existir UN turno fijo de sabado: marcar uno nuevo desmarca los demas.
    if (fijo_sabado) {
      await Horario.update({ fijo_sabado: false }, { where: { fijo_sabado: true }, transaction });
    }

    const horario = await Horario.create({
      nombre,
      hora_inicio,
      hora_fin,
      activo: activo !== undefined ? activo : true,
      fijo_sabado: fijo_sabado === true,
    }, { transaction });

    await transaction.commit();
    return successResponse(res, 201, horario, 'Turno creado');
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
}

async function actualizarHorario(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const horario = await Horario.findByPk(req.params.id, { transaction });
    if (!horario) {
      await transaction.rollback();
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Turno no encontrado');
    }

    const { nombre, hora_inicio, hora_fin, activo, fijo_sabado } = req.body;
    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (hora_inicio !== undefined) cambios.hora_inicio = hora_inicio;
    if (hora_fin !== undefined) cambios.hora_fin = hora_fin;
    if (activo !== undefined) cambios.activo = !!activo;
    if (fijo_sabado !== undefined) cambios.fijo_sabado = !!fijo_sabado;

    if (cambios.fijo_sabado) {
      await Horario.update({ fijo_sabado: false }, { where: { fijo_sabado: true, id: { [Op.ne]: horario.id } }, transaction });
    }

    await horario.update(cambios, { transaction });
    await transaction.commit();
    return successResponse(res, 200, horario, 'Turno actualizado');
  } catch (err) {
    await transaction.rollback();
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

// Lunes de la semana en curso (formato YYYY-MM-DD): la semana laboral del
// tecnico empieza en lunes, igual que en el panel del administrador.
function semanaActual() {
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const y = lunes.getFullYear();
  const m = String(lunes.getMonth() + 1).padStart(2, '0');
  const d = String(lunes.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Semana del tecnico logueado (su perfil): devuelve SOLO sus dias guardados.
// Si no se pasa ?semana= usa la semana en curso.
async function obtenerMiSemana(req, res, next) {
  try {
    const { semana } = req.query;
    const semanaFinal = semana && /^\d{4}-\d{2}-\d{2}$/.test(semana) ? semana : semanaActual();

    const filas = await HorarioTecnico.findAll({
      where: { tecnico_id: req.usuario.id, semana: semanaFinal },
      include: [{ model: Horario, as: 'horario', attributes: ['id', 'nombre', 'hora_inicio', 'hora_fin'] }],
      order: [['dia_semana', 'ASC']],
    });

    const dias = filas.map((f) => ({
      dia_semana: f.dia_semana,
      horario_id: f.horario_id,
      horario_nombre: f.horario?.nombre || null,
      hora_inicio: f.horario?.hora_inicio || null,
      hora_fin: f.horario?.hora_fin || null,
      descanso: f.descanso,
    }));

    return successResponse(res, 200, { semana: semanaFinal, dias });
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

    // Regla del sabado (regla de negocio del panel):
    // 1) El unico turno asignable al sabado es el "fijo de sabado" del catalogo
    //    (fijo_sabado=true; por defecto el 8-5). Si el catalogo no tiene un
    //    turno fijo activo, el sabado no se puede asignar a nadie.
    // 2) Maximo 2 tecnicos trabajando ese dia en la misma semana.
    const sabado = normalizados.find((n) => n.dia_semana === DIA_SABADO && n.horario_id);
    if (sabado) {
      const turnoFijoSabado = await Horario.findOne({
        where: { fijo_sabado: true },
        transaction,
      });
      if (!turnoFijoSabado || !turnoFijoSabado.activo) {
        await transaction.rollback();
        return errorResponse(
          res, 400, ERR_VALIDATION,
          'No hay un turno fijo de sabado activo en el catalogo: marcalo en Editar turnos',
        );
      }
      if (Number(sabado.horario_id) !== turnoFijoSabado.id) {
        await transaction.rollback();
        return errorResponse(
          res, 400, ERR_VALIDATION,
          `El sabado solo acepta el turno fijo (${turnoFijoSabado.nombre})`,
        );
      }

      const ocupantesSabado = await HorarioTecnico.count({
        where: {
          semana,
          dia_semana: DIA_SABADO,
          horario_id: { [Op.ne]: null },
          tecnico_id: { [Op.ne]: tecnico.id },
        },
        // Solo cuentan los tecnicos activos: un tecnico desactivado no se ve
        // en la grilla del panel y no debe ocupar cupo del sabado.
        include: [{ model: Usuario, as: 'tecnico', where: { activo: true }, required: true }],
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

module.exports = { listarHorarios, crearHorario, actualizarHorario, obtenerGrilla, guardarTecnicoSemana, obtenerMiSemana };