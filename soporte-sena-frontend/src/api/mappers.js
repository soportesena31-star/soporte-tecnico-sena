// El backend usa minusculas/snake_case como contrato de API (correcto para
// filtros por query param). Los componentes del mockup esperan los mismos
// valores capitalizados en español. Este archivo es el unico lugar donde
// se traduce entre ambos mundos.

export const ESTADO_DISPLAY = {
  abierto: 'Abierto',
  asignado: 'Asignado',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  reabierto: 'Reabierto',
};

export const PRIORIDAD_DISPLAY = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

export const TIPO_ESPACIO_DISPLAY = {
  aula: 'Ambiente',
  laboratorio: 'Laboratorio',
  auditorio: 'Auditorio',
  oficina: 'Oficina',
  zona_comun: 'Zona común',
  otro: 'Otro',
};

const TIPO_ESPACIO_API = Object.fromEntries(
  Object.entries(TIPO_ESPACIO_DISPLAY).map(([api, display]) => [display, api]),
);

const ACCION_DISPLAY = {
  creado: 'Caso creado',
  asignado: 'Caso asignado',
  en_proceso: 'Trabajo iniciado',
  nota: 'Nota agregada',
  resuelto: 'Caso resuelto',
  cerrado: 'Caso cerrado',
  reabierto: 'Caso reabierto',
  reasignado: 'Caso reasignado',
};

export function mapEspacio(e) {
  if (!e) return null;
  return {
    id: String(e.id),
    name: e.nombre,
    type: TIPO_ESPACIO_DISPLAY[e.tipo] || e.tipo,
    sede: e.sede || '',
    active: e.estado === 'activo',
  };
}

export function tipoEspacioAApi(tipoDisplay) {
  return TIPO_ESPACIO_API[tipoDisplay];
}

export function mapTecnico(u) {
  if (!u) return null;
  const iniciales = (u.nombre || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return {
    id: String(u.id),
    name: u.nombre,
    email: u.email,
    role: u.rol === 'administrador' ? 'Administrador' : 'Técnico',
    avatar: iniciales || '??',
    casesResolved: u.casosResueltos ?? 0,
    activo: u.activo !== false,
  };
}

function mapEvento(h) {
  return {
    id: String(h.id),
    date: h.createdAt,
    action: ACCION_DISPLAY[h.accion] || h.accion,
    actor: h.usuario?.nombre || 'Sistema',
    note: h.detalle || undefined,
  };
}

function parseFotos(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return [String(parsed)]
  } catch {
    return [String(raw)]
  }
}

/** Convierte la respuesta completa de un Caso (con includes) a la forma Case del mockup */
export function mapCaso(c) {
  if (!c) return null;
  const photos = parseFotos(c.foto_novedad)
  const evidences = parseFotos(c.foto_evidencia)

  return {
    id: String(c.id),
    number: c.numero_caso,
    status: ESTADO_DISPLAY[c.estado] || c.estado,
    priority: PRIORIDAD_DISPLAY[c.prioridad] || c.prioridad,
    space: mapEspacio(c.espacio) || (c.ubicacion_personalizada ? { id: '', name: c.ubicacion_personalizada, type: 'Ubicación no registrada', sede: 'Personalizada', active: true } : { id: '', name: '—', type: 'Otro', sede: '', active: true }),
    category: c.categoria?.nombre || 'Otro',
    reportedBy: c.reportado_por,
    description: c.descripcion,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt || c.createdAt,
    assignedTo: c.tecnico ? mapTecnico(c.tecnico) : undefined,
    resolutionTime: c.fecha_resolucion || undefined,
    evidence: evidences[0] || undefined,
    evidences,
    photo: photos[0] || undefined,
    photos,
    resolutionNotes: c.notas_resolucion || undefined,
    reopenCount: c.veces_reabierto || 0,
    timeline: Array.isArray(c.historial) ? c.historial.map(mapEvento) : [],
  };
}

export function mapCasoResumen(c) {
  // Para listados (GET /api/casos) donde no siempre viene el historial completo
  return mapCaso(c);
}

const ROL_DISPLAY = { tecnico: 'Técnico', administrador: 'Administrador' };
const ACCION_TIPO = {
  creado: 'create',
  asignado: 'assign',
  en_proceso: 'status',
  nota: 'status',
  resuelto: 'resolve',
  cerrado: 'close',
  reabierto: 'status',
  reasignado: 'assign',
};

/** Convierte una entrada de GET /api/historial (feed global) a la forma que usa HistorySection */
export function mapHistorialGlobal(h) {
  if (!h) return null;
  const nombreRolRaw = typeof h.usuario?.rol === 'object' ? h.usuario.rol?.nombre : h.usuario?.rol;
  return {
    id: String(h.id),
    time: h.createdAt,
    action: ACCION_DISPLAY[h.accion] || h.accion,
    actor: h.usuario?.nombre || 'Sistema (QR)',
    target: h.caso?.numero_caso || '—',
    role: ROL_DISPLAY[nombreRolRaw] || nombreRolRaw || 'Sistema',
    type: ACCION_TIPO[h.accion] || 'status',
  };
}
