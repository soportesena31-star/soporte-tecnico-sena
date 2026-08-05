const {
  HistorialCaso, Caso, Usuario, Role,
} = require('../models');
const ExcelJS = require('exceljs');
const { successResponse } = require('../utils/response');

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

const ACCION_TIPO = {
  creado: 'Creación', asignado: 'Asignación', en_proceso: 'Estado', nota: 'Estado',
  resuelto: 'Resolución', cerrado: 'Cierre', reabierto: 'Estado', reasignado: 'Asignación',
};

const ROL_DISPLAY = { tecnico: 'Técnico', administrador: 'Administrador' };

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}

async function cargarHistorial(limite) {
  return HistorialCaso.findAll({
    attributes: ['id', 'accion', 'detalle', 'createdAt'],
    include: [
      { model: Caso, as: 'caso', attributes: ['numero_caso'] },
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['nombre'],
        include: [{ model: Role, as: 'rol', attributes: ['nombre'] }],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: limite,
  });
}

async function listarHistorialGlobal(req, res, next) {
  try {
    const limite = Math.min(Number(req.query.limite) || 50, 200);
    const eventos = await cargarHistorial(limite);
    return successResponse(res, 200, eventos);
  } catch (err) {
    next(err);
  }
}

const VERDE = 'FF39A900';
const VERDE_OSCURO = 'FF2E7D00';
const VERDE_FONDO = 'FFDCFCE7';
const GRIS = 'FFF3F4F6';

async function exportarHistorial(req, res, next) {
  try {
    const limite = Math.min(Number(req.query.limite) || 200, 500);
    const eventos = await cargarHistorial(limite);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema Soporte Técnico SENA';
    wb.created = new Date();
    const ws = wb.addWorksheet('Historial', { views: [{ state: 'frozen', ySplit: 4 }] });

    ws.mergeCells(1, 1, 1, 7);
    const t = ws.getCell(1, 1);
    t.value = 'HISTORIAL DE CASOS — SENA';
    t.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
    t.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 26;

    ws.mergeCells(2, 1, 2, 7);
    const s = ws.getCell(2, 1);
    s.value = `Registros: ${eventos.length}  ·  Generado: ${fmtFecha(new Date().toISOString())}`;
    s.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF6B7280' } };
    s.alignment = { horizontal: 'center' };
    ws.getRow(2).height = 18;

    ws.mergeCells(3, 1, 3, 7);
    const nota = ws.getCell(3, 1);
    nota.value = 'El historial se organiza del más reciente al más antiguo.';
    nota.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF9CA3AF' } };
    nota.alignment = { horizontal: 'center' };
    ws.getRow(3).height = 15;

    const headers = ['Fecha', 'Tipo', 'Acción', 'Caso', 'Detalle', 'Actor', 'Rol'];
    const widths = [20, 14, 22, 18, 46, 24, 14];
    const hRow = ws.getRow(4);
    headers.forEach((h, i) => {
      const cell = hRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_OSCURO } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    hRow.height = 20;
    widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    eventos.forEach((e, idx) => {
      const nombreRol = e.usuario?.rol ? e.usuario.rol.nombre : null;
      const row = ws.getRow(5 + idx);
      const values = [
        fmtFecha(e.createdAt),
        ACCION_TIPO[e.accion] || '—',
        ACCION_DISPLAY[e.accion] || e.accion,
        e.caso?.numero_caso || '—',
        e.detalle || '—',
        e.usuario?.nombre || 'Sistema (QR)',
        ROL_DISPLAY[nombreRol] || 'Sistema',
      ];
      const izquierda = [2, 3, 4, 5, 6];
      values.forEach((val, i) => {
        const cell = row.getCell(i + 1);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1F2937' } };
        cell.alignment = { vertical: 'middle', horizontal: izquierda.includes(i) ? 'left' : 'center' };
        if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS } };
      });
      row.height = 16;
    });

    ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + Math.max(0, eventos.length - 1) + 1, column: 7 } };

    const buffer = await wb.xlsx.writeBuffer();
    const nombreBase = `historial-soporte-sena-${new Date().toISOString().slice(0, 10)}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreBase}.xlsx"`);
    return res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
}

module.exports = { listarHistorialGlobal, exportarHistorial };