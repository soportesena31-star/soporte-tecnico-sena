const { Op } = require('sequelize');
const {
  Caso, Espacio, Categoria, Usuario, Role, HistorialCaso, Configuracion, sequelize,
} = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../config/logger');
const { notificarRoles, notificarUsuario } = require('../services/pushService');
const { publicar: publicarEvento } = require('../services/eventBus');
const {
  ERR_NOT_FOUND, ERR_VALIDATION, ERR_ESPACIO_INACTIVO, ERR_ESTADO_INVALIDO,
  ERR_CASO_YA_ASIGNADO, ERR_EVIDENCIA_REQUERIDA, ERR_FORBIDDEN,
} = require('../utils/errorCodes');

async function crearCaso(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const {
      espacio_id, categoria_id, reportado_por, descripcion, ubicacion_personalizada,
    } = req.body;

    // El caso apunta a un espacio registrado O a una ubicacion personalizada
    // ("Otra ubicacion (No listada)" en el formulario). Ambos vacios -> error.
    if (!espacio_id && !(ubicacion_personalizada && ubicacion_personalizada.trim())) {
      await t.rollback();
      return errorResponse(res, 400, ERR_VALIDATION, 'Debes seleccionar un espacio o indicar una ubicacion');
    }

    let espacio = null;
    if (espacio_id) {
      espacio = await Espacio.findByPk(espacio_id);
      if (!espacio || espacio.estado !== 'activo') {
        await t.rollback();
        return errorResponse(res, 400, ERR_ESPACIO_INACTIVO, 'El espacio seleccionado no esta disponible');
      }
    }

    const categoria = await Categoria.findByPk(categoria_id);
    if (!categoria) {
      await t.rollback();
      return errorResponse(res, 400, ERR_VALIDATION, 'Categoria no valida');
    }

    // Multer puede entregar `req.files` (fields) o `req.file`.
    let filenames = []
    if (req.files) {
      // Cuando se usa upload.fields, req.files es un objeto con arrays por campo
      if (Array.isArray(req.files)) {
        filenames = req.files.map(f => f.filename)
      } else {
        // req.files puede tener { fotos_novedad: [...], foto_novedad: [...] }
        const farr = []
        if (Array.isArray(req.files.fotos_novedad)) farr.push(...req.files.fotos_novedad.map(f => f.filename))
        if (Array.isArray(req.files.foto_novedad)) farr.push(...req.files.foto_novedad.map(f => f.filename))
        filenames = farr
      }
    } else if (req.file) {
      filenames = [req.file.filename]
    }

    const caso = await Caso.create({
      espacio_id: espacio_id || null,
      ubicacion_personalizada: (ubicacion_personalizada && ubicacion_personalizada.trim()) || null,
      categoria_id,
      reportado_por,
      descripcion,
      prioridad: categoria.prioridad_sugerida,
      foto_novedad: filenames.length ? JSON.stringify(filenames) : null,
    }, { transaction: t });

    await HistorialCaso.create({
      caso_id: caso.id,
      accion: 'creado',
      detalle: `Reportado por ${reportado_por}`,
    }, { transaction: t });

    // Asignación automática (opt-in): si el admin la activo en Configuracion,
    // el caso recien creado se asigna al tecnico activo con menos carga.
    const config = await Configuracion.findOne({ where: { id: 1 }, transaction: t });
    if (config?.asignacion_automatica) {
      const tecnicos = await Usuario.findAll({
        where: { activo: true },
        include: [{ model: Role, as: 'rol', where: { nombre: 'tecnico' }, required: true }],
        transaction: t,
      });
      let mejor = null;
      let mejorCarga = Infinity;
      for (const tec of tecnicos) {
        const carga = await Caso.count({
          where: {
            tecnico_id: tec.id,
            estado: { [Op.in]: ['abierto', 'asignado', 'en_proceso', 'reabierto'] },
          },
          transaction: t,
        });
        if (carga < mejorCarga) { mejorCarga = carga; mejor = tec; }
      }
      if (mejor) {
        await caso.update({
          estado: 'asignado',
          tecnico_id: mejor.id,
          fecha_asignacion: new Date(),
        }, { transaction: t });
        await HistorialCaso.create({
          caso_id: caso.id,
          accion: 'asignado',
          usuario_id: null,
          detalle: `Asignación automática a ${mejor.nombre}`,
        }, { transaction: t });
      }
    }

    await t.commit();

    const casoCompleto = await Caso.findByPk(caso.id, {
      include: [
        { model: Espacio, as: 'espacio' },
        { model: Categoria, as: 'categoria' },
      ],
    });

    logger.info('Caso creado', { numero_caso: casoCompleto.numero_caso });

    // Alerta en vivo: notificacion push a tecnicos/admin y evento SSE para
    // los paneles abiertos. Fire-and-forget: no debe bloquear la respuesta.
    const nombreEspacio = casoCompleto.espacio?.nombre
      || casoCompleto.ubicacion_personalizada
      || 'ubicacion no registrada';
    const resumen = `${casoCompleto.numero_caso} - ${nombreEspacio} (${casoCompleto.categoria?.nombre || 'Sin categoria'})`;

    notificarRoles(['tecnico', 'administrador'], {
      title: 'Nuevo caso de soporte',
      body: resumen,
      data: { numero_caso: casoCompleto.numero_caso, caso_id: casoCompleto.id },
      badge: '/icons/icon-192.png',
      icon: '/icons/icon-192.png',
    });
    publicarEvento('nuevo_caso', {
      numero_caso: casoCompleto.numero_caso,
      caso_id: casoCompleto.id,
      resumen,
    });

    return successResponse(res, 201, casoCompleto, 'Caso registrado');
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function consultarPorNumero(req, res, next) {
  try {
    const caso = await Caso.findOne({
      where: { numero_caso: req.params.numero_caso },
      attributes: [
        'id', 'numero_caso', 'estado', 'prioridad', 'descripcion', 'reportado_por',
        'foto_novedad', 'foto_evidencia', 'notas_resolucion', 'ubicacion_personalizada',
        'createdAt', 'fecha_asignacion', 'fecha_resolucion', 'veces_reabierto',
      ],
      include: [
        { model: Espacio, as: 'espacio', attributes: ['nombre', 'tipo'] },
        { model: Categoria, as: 'categoria', attributes: ['nombre'] },
        { model: Usuario, as: 'tecnico', attributes: ['nombre'] },
        {
          model: HistorialCaso,
          as: 'historial',
          attributes: ['accion', 'detalle', 'createdAt'],
          include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
        },
      ],
      order: [[{ model: HistorialCaso, as: 'historial' }, 'createdAt', 'ASC']],
    });
    if (!caso) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'No existe un caso con ese numero');
    }
    return successResponse(res, 200, caso);
  } catch (err) {
    next(err);
  }
}

async function listarCasos(req, res, next) {
  try {
    const {
      estado, espacio_id, tecnico_id, desde, hasta,
    } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (espacio_id) where.espacio_id = espacio_id;
    if (tecnico_id) where.tecnico_id = tecnico_id;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(desde);
      if (hasta) where.createdAt[Op.lte] = new Date(`${hasta}T23:59:59`);
    }

    const casos = await Caso.findAll({
      where,
      include: [
        { model: Espacio, as: 'espacio' },
        { model: Categoria, as: 'categoria' },
        { model: Usuario, as: 'tecnico', attributes: ['id', 'nombre'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return successResponse(res, 200, casos);
  } catch (err) {
    next(err);
  }
}

async function tomarCaso(req, res, next) {
  try {
    // Solo un tecnico activo puede tomar un caso; el admin asigna via /asignar.
    if (req.usuario?.rol?.nombre !== 'tecnico') {
      return errorResponse(res, 403, ERR_FORBIDDEN, 'Solo los tecnicos pueden tomar casos');
    }
    const caso = await Caso.findByPk(req.params.id);
    if (!caso) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Caso no encontrado');
    }
    if (caso.estado !== 'abierto') {
      return errorResponse(res, 409, ERR_CASO_YA_ASIGNADO, 'Este caso ya fue tomado por otro tecnico');
    }

    await caso.update({
      estado: 'asignado',
      tecnico_id: req.usuario.id,
      fecha_asignacion: new Date(),
    });

    await HistorialCaso.create({
      caso_id: caso.id,
      accion: 'asignado',
      usuario_id: req.usuario.id,
    });

    return successResponse(res, 200, caso, 'Caso asignado');
  } catch (err) {
    next(err);
  }
}

async function asignarCaso(req, res, next) {
  try {
    const caso = await Caso.findByPk(req.params.id);
    if (!caso) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Caso no encontrado');
    }
    if (['resuelto', 'cerrado'].includes(caso.estado)) {
      return errorResponse(res, 409, ERR_ESTADO_INVALIDO, 'No se puede asignar un caso resuelto o cerrado');
    }

    const { tecnico_id } = req.body;
    const tecnico = await Usuario.findByPk(tecnico_id, {
      include: [{ model: Role, as: 'rol' }],
    });
    if (!tecnico || !tecnico.activo || tecnico.rol?.nombre !== 'tecnico') {
      return errorResponse(res, 400, ERR_VALIDATION, 'Debes seleccionar un tecnico valido');
    }

    await caso.update({
      estado: 'asignado',
      tecnico_id: tecnico.id,
      fecha_asignacion: new Date(),
    });

    await HistorialCaso.create({
      caso_id: caso.id,
      accion: 'asignado',
      usuario_id: req.usuario.id,
      detalle: `Asignado manualmente por el administrador a ${tecnico.nombre}`,
    });

    const casoActualizado = await Caso.findByPk(caso.id, {
      include: [
        { model: Espacio, as: 'espacio' },
        { model: Categoria, as: 'categoria' },
        { model: Usuario, as: 'tecnico', attributes: ['id', 'nombre'] },
      ],
    });

    return successResponse(res, 200, casoActualizado, 'Caso asignado');
  } catch (err) {
    next(err);
  }
}

async function reasignarCaso(req, res, next) {
  try {
    // Puede reasignar el tecnico actualmente asignado al caso, o un
    // administrador (siempre). Un tecnico que no es el asignado no puede.
    const caso = await Caso.findByPk(req.params.id);
    if (!caso) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Caso no encontrado');
    }
    if (['resuelto', 'cerrado'].includes(caso.estado)) {
      return errorResponse(res, 409, ERR_ESTADO_INVALIDO, 'No se puede reasignar un caso resuelto o cerrado');
    }
    const esAdministrador = req.usuario?.rol?.nombre === 'administrador';
    const esTecnicoAsignado = caso.tecnico_id === req.usuario.id;
    if (!esAdministrador && !esTecnicoAsignado) {
      return errorResponse(res, 403, ERR_FORBIDDEN, 'Solo el tecnico asignado o un administrador pueden reasignar este caso');
    }

    const { tecnico_id, motivo } = req.body;
    if (caso.tecnico_id && Number(caso.tecnico_id) === Number(tecnico_id)) {
      return errorResponse(res, 400, ERR_VALIDATION, 'El caso ya esta asignado a ese tecnico');
    }

    const tecnicoNuevo = await Usuario.findByPk(tecnico_id, {
      include: [{ model: Role, as: 'rol' }],
    });
    if (!tecnicoNuevo || !tecnicoNuevo.activo || tecnicoNuevo.rol?.nombre !== 'tecnico') {
      return errorResponse(res, 400, ERR_VALIDATION, 'Debes seleccionar un tecnico valido');
    }

    // Se conserva el estado: si iba en_proceso, sigue en_proceso con el nuevo tecnico.
    // Ojo: capturar el tecnico anterior ANTES del update (previous() de Sequelize
    // ya devolveria el valor nuevo tras update()).
    const tecnicoAnteriorId = caso.tecnico_id;
    await caso.update({
      tecnico_id: tecnicoNuevo.id,
      fecha_asignacion: new Date(),
    });

    const tecnicoAnterior = tecnicoAnteriorId
      ? await Usuario.findByPk(tecnicoAnteriorId, { attributes: ['nombre'] })
      : null;

    const partes = [
      `Reasignado de ${tecnicoAnterior?.nombre || 'sin tecnico'} a ${tecnicoNuevo.nombre}`,
    ];
    if (motivo && motivo.trim()) partes.push(`Motivo: ${motivo.trim()}`);

    await HistorialCaso.create({
      caso_id: caso.id,
      accion: 'reasignado',
      usuario_id: req.usuario.id,
      detalle: partes.join(' | '),
    });

    const casoActualizado = await Caso.findByPk(caso.id, {
      include: [
        { model: Espacio, as: 'espacio' },
        { model: Categoria, as: 'categoria' },
        { model: Usuario, as: 'tecnico', attributes: ['id', 'nombre'] },
        {
          model: HistorialCaso,
          as: 'historial',
          attributes: ['id', 'accion', 'detalle', 'createdAt'],
          include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    logger.info('Caso reasignado', { numero_caso: casoActualizado.numero_caso, a: tecnicoNuevo.id });

    // Avisa al nuevo tecnico (solo a el) y refresca los paneles abiertos.
    const nombreEspacio = casoActualizado.espacio?.nombre
      || casoActualizado.ubicacion_personalizada
      || 'ubicacion no registrada';
    const resumen = `${casoActualizado.numero_caso} - ${nombreEspacio} (${casoActualizado.categoria?.nombre || 'Sin categoria'})`;

    notificarUsuario(tecnicoNuevo.id, {
      title: 'Caso reasignado a ti',
      body: resumen,
      data: { numero_caso: casoActualizado.numero_caso, caso_id: casoActualizado.id },
      badge: '/icons/icon-192.png',
      icon: '/icons/icon-192.png',
    });
    publicarEvento('caso_actualizado', {
      numero_caso: casoActualizado.numero_caso,
      caso_id: casoActualizado.id,
      resumen,
      accion: 'reasignado',
    });

    return successResponse(res, 200, casoActualizado, 'Caso reasignado');
  } catch (err) {
    next(err);
  }
}

async function iniciarCaso(req, res, next) {
  try {
    const caso = await Caso.findByPk(req.params.id);
    if (!caso) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Caso no encontrado');
    }
    if (caso.estado !== 'asignado') {
      return errorResponse(res, 409, ERR_ESTADO_INVALIDO, 'El caso debe estar asignado para iniciar el trabajo');
    }
    if (caso.tecnico_id !== req.usuario.id && req.usuario.rol?.nombre !== 'administrador') {
      return errorResponse(res, 403, ERR_FORBIDDEN, 'Solo el tecnico asignado puede iniciar este caso');
    }

    await caso.update({ estado: 'en_proceso' });

    await HistorialCaso.create({
      caso_id: caso.id,
      accion: 'en_proceso',
      usuario_id: req.usuario.id,
    });

    return successResponse(res, 200, caso, 'Trabajo iniciado');
  } catch (err) {
    next(err);
  }
}

async function agregarNota(req, res, next) {
  try {
    const caso = await Caso.findByPk(req.params.id);
    if (!caso) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Caso no encontrado');
    }
    const { nota } = req.body;
    if (!nota || !nota.trim()) {
      return errorResponse(res, 400, ERR_VALIDATION, 'La nota no puede estar vacia');
    }

    const entrada = await HistorialCaso.create({
      caso_id: caso.id,
      accion: 'nota',
      usuario_id: req.usuario.id,
      detalle: nota.trim(),
    });

    return successResponse(res, 201, entrada, 'Nota agregada');
  } catch (err) {
    next(err);
  }
}

async function resolverCaso(req, res, next) {
  try {
    const caso = await Caso.findByPk(req.params.id);
    if (!caso) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Caso no encontrado');
    }
    if (!['asignado', 'en_proceso'].includes(caso.estado)) {
      return errorResponse(res, 409, ERR_ESTADO_INVALIDO, 'El caso debe estar asignado para poder resolverse');
    }
    if (caso.tecnico_id !== req.usuario.id && req.usuario.rol?.nombre !== 'administrador') {
      return errorResponse(res, 403, ERR_FORBIDDEN, 'Solo el tecnico asignado puede resolver este caso');
    }
    // soportar tanto req.file (antiguo) como req.files (array) y requerir al menos 1 evidencia
    let evidenceFiles = []
    if (req.files) {
      if (Array.isArray(req.files)) {
        evidenceFiles = req.files.map(f => f.filename)
      } else {
        // cuando se usa fields, puede venir como objeto
        const farr = []
        if (Array.isArray(req.files.foto_evidencia)) farr.push(...req.files.foto_evidencia.map(f => f.filename))
        if (Array.isArray(req.files.fotos_evidencia)) farr.push(...req.files.fotos_evidencia.map(f => f.filename))
        evidenceFiles = farr
      }
    } else if (req.file) {
      evidenceFiles = [req.file.filename]
    }

    if (evidenceFiles.length === 0) {
      return errorResponse(res, 400, ERR_EVIDENCIA_REQUERIDA, 'La foto de evidencia es obligatoria para resolver el caso')
    }

    await caso.update({
      estado: 'resuelto',
      notas_resolucion: req.body.notas_resolucion,
      foto_evidencia: evidenceFiles.length ? JSON.stringify(evidenceFiles) : null,
      fecha_resolucion: new Date(),
    });

    await HistorialCaso.create({
      caso_id: caso.id,
      accion: 'resuelto',
      usuario_id: req.usuario.id,
      detalle: req.body.notas_resolucion,
    });

    return successResponse(res, 200, caso, 'Caso resuelto');
  } catch (err) {
    next(err);
  }
}

async function reabrirCaso(req, res, next) {
  try {
    const caso = await Caso.findByPk(req.params.id);
    if (!caso) {
      return errorResponse(res, 404, ERR_NOT_FOUND, 'Caso no encontrado');
    }
    if (!['resuelto', 'cerrado'].includes(caso.estado)) {
      return errorResponse(res, 409, ERR_ESTADO_INVALIDO, 'Solo se pueden reabrir casos resueltos o cerrados');
    }

    await caso.update({
      estado: 'reabierto',
      veces_reabierto: caso.veces_reabierto + 1,
    });

    await HistorialCaso.create({
      caso_id: caso.id,
      accion: 'reabierto',
      usuario_id: req.usuario ? req.usuario.id : null,
      detalle: req.body.motivo || null,
    });

    return successResponse(res, 200, caso, 'Caso reabierto');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  crearCaso,
  consultarPorNumero,
  listarCasos,
  tomarCaso,
  asignarCaso,
  reasignarCaso,
  iniciarCaso,
  agregarNota,
  resolverCaso,
  reabrirCaso,
};
