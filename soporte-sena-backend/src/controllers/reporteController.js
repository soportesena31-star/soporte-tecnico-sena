const { Op, fn, col, literal } = require('sequelize');
const {
  Caso, Espacio, Categoria, Usuario,
} = require('../models');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { successResponse, errorResponse } = require('../utils/response');
const { ERR_VALIDATION } = require('../utils/errorCodes');

const ESTADO_LABEL = {
  abierto: 'Abierto', asignado: 'Asignado', en_proceso: 'En proceso',
  resuelto: 'Resuelto', cerrado: 'Cerrado', reabierto: 'Reabierto',
};
const PRIORIDAD_LABEL = { alta: 'Alta', media: 'Media', baja: 'Baja' };

function label(v, map) {
  return map[v] || v || '—';
}

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

// ─────────────────────────────────────────────
//  Recopilación de los datos del reporte
// ─────────────────────────────────────────────
async function recopilarDatos(desde, hasta) {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(`${hasta}T23:59:59`);

  const where = { createdAt: { [Op.between]: [fechaDesde, fechaHasta] } };

  const casos = await Caso.findAll({
    where,
    include: [
      { model: Espacio, as: 'espacio', attributes: ['nombre', 'tipo'] },
      { model: Categoria, as: 'categoria', attributes: ['nombre'] },
      { model: Usuario, as: 'tecnico', attributes: ['nombre'] },
    ],
    order: [['createdAt', 'ASC']],
  });

  const porEstadoRaw = await Caso.findAll({
    where,
    attributes: ['estado', [fn('COUNT', col('Caso.id')), 'total']],
    group: ['estado'],
    raw: true,
  });

  const porCategoriaRaw = await Caso.findAll({
    where,
    attributes: [[fn('COUNT', col('Caso.id')), 'total']],
    include: [{ model: Categoria, as: 'categoria', attributes: ['nombre'], required: true }],
    group: ['categoria.id', 'categoria.nombre'],
    order: [[fn('COUNT', col('Caso.id')), 'DESC']],
    raw: true,
    nest: true,
  });

  const porEspacioRaw = await Caso.findAll({
    where,
    attributes: [[fn('COUNT', col('Caso.id')), 'total']],
    include: [{ model: Espacio, as: 'espacio', attributes: ['nombre', 'tipo'], required: true }],
    group: ['espacio.id', 'espacio.nombre', 'espacio.tipo'],
    order: [[fn('COUNT', col('Caso.id')), 'DESC']],
    limit: 10,
    raw: true,
    nest: true,
  });

  const tiempoTecnicoRaw = await Caso.findAll({
    where: {
      ...where,
      estado: { [Op.in]: ['resuelto', 'cerrado'] },
      fecha_resolucion: { [Op.not]: null },
      tecnico_id: { [Op.not]: null },
    },
    attributes: [
      'tecnico_id',
      [fn('COUNT', col('Caso.id')), 'casos_resueltos'],
      [fn('AVG', literal('TIMESTAMPDIFF(MINUTE, Caso.created_at, Caso.fecha_resolucion)')), 'minutos_promedio'],
    ],
    include: [{ model: Usuario, as: 'tecnico', attributes: ['nombre'], required: true }],
    group: ['tecnico_id', 'tecnico.id', 'tecnico.nombre'],
    raw: true,
    nest: true,
  });

  const promedioGlobalRaw = await Caso.findAll({
    where: {
      ...where,
      estado: { [Op.in]: ['resuelto', 'cerrado'] },
      fecha_resolucion: { [Op.not]: null },
    },
    attributes: [
      [fn('AVG', literal('TIMESTAMPDIFF(MINUTE, Caso.created_at, Caso.fecha_resolucion)')), 'minutos_promedio'],
      [fn('COUNT', col('Caso.id')), 'total_resueltos'],
    ],
    raw: true,
  });

  const minutosProm = promedioGlobalRaw[0]?.minutos_promedio;
  const tiempo_promedio_resolucion = minutosProm !== null && minutosProm !== undefined
    ? { minutos: Math.round(Number(minutosProm)), horas: Number((Number(minutosProm) / 60).toFixed(1)) }
    : null;

  return {
    rango: { desde, hasta },
    total_casos: casos.length,
    resumen_por_estado: porEstadoRaw.map((r) => ({ estado: r.estado, total: Number(r.total) })),
    resumen_por_categoria: porCategoriaRaw.map((r) => ({ categoria: r.categoria?.nombre || 'Sin categoría', total: Number(r.total) })),
    espacios_recurrentes: porEspacioRaw.map((r) => ({ espacio: r.espacio?.nombre || 'Desconocido', tipo: r.espacio?.tipo || '', total: Number(r.total) })),
    rendimiento_tecnicos: tiempoTecnicoRaw.map((r) => ({
      tecnico: r.tecnico?.nombre || 'Desconocido',
      casos_resueltos: Number(r.casos_resueltos),
      horas_promedio: r.minutos_promedio !== null ? Number((Number(r.minutos_promedio) / 60).toFixed(1)) : null,
    })),
    tiempo_promedio_resolucion,
    total_resueltos: Number(promedioGlobalRaw[0]?.total_resueltos || 0),
    casos,
  };
}

// ─────────────────────────────────────────────
//  Generador de Excel (exceljs)
// ─────────────────────────────────────────────
const VERDE = 'FF39A900';
const VERDE_OSCURO = 'FF2E7D00';
const VERDE_FONDO = 'FFDCFCE7';
const GRIS = 'FFF3F4F6';
const BORDE = 'FFE5E7EB';

function encabezadoHoja(ws, titulo, subtitulo, totalCols) {
  ws.mergeCells(1, 1, 1, totalCols);
  const t = ws.getCell(1, 1);
  t.value = titulo;
  t.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
  t.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 26;

  ws.mergeCells(2, 1, 2, totalCols);
  const s = ws.getCell(2, 1);
  s.value = subtitulo;
  s.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF6B7280' } };
  s.alignment = { horizontal: 'center' };
  ws.getRow(2).height = 18;
}

function seccion(ws, row, titulo) {
  ws.mergeCells(row, 1, row, 8);
  const c = ws.getCell(row, 1);
  c.value = titulo;
  c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F2937' } };
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_FONDO } };
  c.alignment = { vertical: 'middle' };
  ws.getRow(row).height = 20;
  return row + 1;
}

function tabla(ws, startRow, headers, rows, widths, izquierda = []) {
  const hRow = ws.getRow(startRow);
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_OSCURO } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  hRow.height = 20;

  rows.forEach((r, idx) => {
    const row = ws.getRow(startRow + 1 + idx);
    r.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1F2937' } };
      cell.alignment = { vertical: 'middle', horizontal: izquierda.includes(i) ? 'left' : 'center' };
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS } };
    });
    row.height = 18;
  });

  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  return startRow + 1 + rows.length;
}

async function generarExcel(datos) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Soporte Técnico SENA';
  wb.created = new Date();
  const periodo = `Periodo: ${datos.rango.desde} al ${datos.rango.hasta}  ·  Generado: ${fmtFecha(new Date().toISOString())}`;

  // ── Hoja Resumen ──
  const ws = wb.addWorksheet('Resumen', { views: [{ state: 'frozen', ySplit: 5 }] });
  encabezadoHoja(ws, 'REPORTE DE SOPORTE TÉCNICO — SENA', periodo, 8);

  const kpis = [
    ['TOTAL CASOS', datos.total_casos],
    ['RESUELTOS', datos.total_resueltos],
    ['TIEMPO PROM. RESOLUCIÓN', datos.tiempo_promedio_resolucion ? `${datos.tiempo_promedio_resolucion.horas} h` : '—'],
    ['TASA RESOLUCIÓN', datos.total_casos ? `${Math.round((datos.total_resueltos / datos.total_casos) * 100)}%` : '—'],
  ];
  const kpiRow = ws.getRow(4);
  kpis.forEach(([lbl, val], i) => {
    const col = i * 2 + 1;
    ws.mergeCells(4, col, 4, col + 1);
    const cell = kpiRow.getCell(col);
    cell.value = `${lbl}\n${val}`;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F2937' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS } };
    ws.getColumn(col).width = 16;
    ws.getColumn(col + 1).width = 12;
  });
  kpiRow.height = 42;

  let r = 6;
  r = seccion(ws, r, 'RESUMEN POR ESTADO');
  r = tabla(ws, r, ['Estado', 'Cantidad'], datos.resumen_por_estado.map((e) => [label(e.estado, ESTADO_LABEL), e.total]), [30, 20]);
  r += 1;

  r = seccion(ws, r, 'RESUMEN POR CATEGORÍA');
  r = tabla(ws, r, ['Categoría', 'Cantidad'], datos.resumen_por_categoria.map((e) => [e.categoria, e.total]), [30, 20]);
  r += 1;

  r = seccion(ws, r, 'ESPACIOS CON MÁS CASOS (TOP 10)');
  r = tabla(ws, r, ['Espacio', 'Tipo', 'Casos'], datos.espacios_recurrentes
    ? datos.espacios_recurrentes.map((e) => [e.espacio, e.tipo, e.total])
    : [], [40, 20, 12]);
  r += 1;

  r = seccion(ws, r, 'RENDIMIENTO DE TÉCNICOS');
  r = tabla(ws, r,
    ['Técnico', 'Casos resueltos', 'Tiempo promedio (h)'],
    datos.rendimiento_tecnicos.map((t) => [t.tecnico, t.casos_resueltos, t.horas_promedio ?? '—']),
    [40, 18, 18]);

  // ── Hoja Detalle ──
  const det = wb.addWorksheet('Detalle de casos', { views: [{ state: 'freeze', ySplit: 3, xSplit: 0 }] });
  encabezadoHoja(det, 'DETALLE DE CASOS', `${periodo}  ·  ${datos.total_casos} casos`, 9);
  const detHeaders = ['Número', 'Fecha creación', 'Espacio', 'Categoría', 'Prioridad', 'Estado', 'Reportado por', 'Técnico', 'Fecha resolución'];
  const detRows = datos.casos.map((c) => [
    c.numero_caso,
    fmtFecha(c.createdAt),
    c.espacio?.nombre || '—',
    c.categoria?.nombre || '—',
    label(c.prioridad, PRIORIDAD_LABEL),
    label(c.estado, ESTADO_LABEL),
    c.reportado_por || '—',
    c.tecnico?.nombre || '—',
    fmtFecha(c.fecha_resolucion),
  ]);
  tabla(det, 3, detHeaders, detRows, [18, 20, 28, 24, 12, 12, 24, 22, 18], [2, 3, 4, 6, 7]);
  det.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3 + detRows.length, column: 9 } };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ─────────────────────────────────────────────
//  Generador de PDF (pdfkit)
// ─────────────────────────────────────────────
function generarPdf(datos) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 80;
    const VERDE = '#39A900';
    const OSCURO = '#2E7D00';
    const footer = (text) => {
      doc.fontSize(7).fillColor('#9CA3AF')
        .text(text, 40, doc.page.height - 30, { width: pageWidth, align: 'right' });
    };

    // Cabecera
    doc.rect(0, 0, doc.page.width, 66).fill(VERDE);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(17)
      .text('REPORTE DE SOPORTE TÉCNICO — SENA', 40, 16, { width: pageWidth, align: 'center' });
    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(9)
      .text(`Periodo: ${datos.rango.desde} al ${datos.rango.hasta}`, 40, 40, { width: pageWidth, align: 'center' });

    let y = 84;
    const kpis = [
      ['TOTAL CASOS', datos.total_casos],
      ['RESUELTOS', datos.total_resueltos],
      ['TIEMPO PROM. RESOLUCIÓN', datos.tiempo_promedio_resolucion ? `${datos.tiempo_promedio_resolucion.horas} h` : '—'],
      ['TASA RESOLUCIÓN', datos.total_casos ? `${Math.round((datos.total_resueltos / datos.total_casos) * 100)}%` : '—'],
    ];
    const boxW = pageWidth / 4;
    const boxH = 52;
    kpis.forEach(([lbl, val], i) => {
      const x = 40 + i * boxW;
      doc.roundedRect(x, y, boxW - 6, boxH, 5).fill('#F3F4F6');
      doc.fillColor('#6B7280').font('Helvetica').fontSize(7).text(lbl, x + 4, y + 8, { width: boxW - 14, align: 'center' });
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(13).text(String(val), x + 4, y + 24, { width: boxW - 14, align: 'center' });
    });
    y += boxH + 20;

    const drawHeader = (headers, widths, yy) => {
      let x = 40;
      doc.rect(40, yy, pageWidth, 18).fill(OSCURO);
      headers.forEach((h, i) => {
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5)
          .text(h, x + 3, yy + 5.5, { width: widths[i] - 6, align: 'center' });
        x += widths[i];
      });
      return yy + 18;
    };

    function tablaPDF(titulo, headers, rows, widths, aligns) {
      if (y + 24 > doc.page.height - 50) { doc.addPage(); y = 50; }
      doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text(titulo, 40, y);
      y += 16;
      y = drawHeader(headers, widths, y);
      rows.forEach((row) => {
        if (y + 16 > doc.page.height - 50) {
          doc.addPage();
          y = drawHeader(headers, widths, 50);
        }
        let x = 40;
        row.forEach((val, i) => {
          doc.fillColor('#111827').font('Helvetica').fontSize(7.5)
            .text(String(val), x + 3, y + 4.5, { width: widths[i] - 6, align: aligns[i] || 'left' });
          x += widths[i];
        });
        y += 16;
      });
      y += 14;
    }

    tablaPDF('Resumen por estado',
      ['Estado', 'Cantidad'],
      datos.resumen_por_estado.map((e) => [label(e.estado, ESTADO_LABEL), e.total]),
      [pageWidth * 0.35, pageWidth * 0.15], ['left', 'center']);

    tablaPDF('Resumen por categoría',
      ['Categoría', 'Cantidad'],
      datos.resumen_por_categoria.map((c) => [c.categoria, c.total]),
      [pageWidth * 0.55, pageWidth * 0.15], ['left', 'center']);

    tablaPDF('Rendimiento de técnicos',
      ['Técnico', 'Casos resueltos', 'Tiempo promedio (h)'],
      datos.rendimiento_tecnicos.map((t) => [t.tecnico, t.casos_resueltos, t.horas_promedio ?? '—']),
      [pageWidth * 0.5, pageWidth * 0.18, pageWidth * 0.18], ['left', 'center', 'center']);

    // Detalle
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 50).fill(VERDE);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12)
      .text('DETALLE DE CASOS', 40, 16, { width: pageWidth, align: 'center' });
    let dy = 56;
    const detHeaders = ['Número', 'Fecha', 'Espacio', 'Categoría', 'Prioridad', 'Estado', 'Reportado por', 'Técnico'];
    const detWidths = [64, 56, 72, 58, 42, 42, 72, 64];
    const detAligns = ['center', 'center', 'left', 'left', 'center', 'center', 'left', 'left'];
    const detRows = datos.casos.map((c) => [
      c.numero_caso, fmtFecha(c.createdAt), c.espacio?.nombre || '—', c.categoria?.nombre || '—',
      label(c.prioridad, PRIORIDAD_LABEL), label(c.estado, ESTADO_LABEL), c.reportado_por || '—', c.tecnico?.nombre || '—',
    ]);

    const drawDetHeader = () => {
      let x = 40;
      doc.rect(40, dy, pageWidth, 18).fill(OSCURO);
      detHeaders.forEach((h, i) => {
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(6.5)
          .text(h, x + 2, dy + 5, { width: detWidths[i] - 4, align: 'center' });
        x += detWidths[i];
      });
      dy += 18;
    };

    drawDetHeader();
    detRows.forEach((row) => {
      if (dy + 15 > doc.page.height - 30) {
        doc.addPage();
        dy = 20;
        drawDetHeader();
      }
      let x = 40;
      row.forEach((val, i) => {
        doc.fillColor('#111827').font('Helvetica').fontSize(6.5)
          .text(String(val), x + 2, dy + 4, { width: detWidths[i] - 4, align: detAligns[i] });
        x += detWidths[i];
      });
      dy += 15;
    });

    doc.end();
  });
}

// ─────────────────────────────────────────────
//  Endpoints
// ─────────────────────────────────────────────
async function generarReporte(req, res, next) {
  try {
    const datos = await recopilarDatos(req.query.desde, req.query.hasta);
    return successResponse(res, 200, datos);
  } catch (err) {
    next(err);
  }
}

async function exportarReporte(req, res, next) {
  try {
    const formato = req.query.formato;
    const datos = await recopilarDatos(req.query.desde, req.query.hasta);
    const nombreBase = `reporte-soporte-sena-${req.query.desde}-${req.query.hasta}`;

    if (formato === 'excel') {
      const buffer = await generarExcel(datos);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreBase}.xlsx"`);
      return res.send(buffer);
    }
    if (formato === 'pdf') {
      const buffer = await generarPdf(datos);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreBase}.pdf"`);
      return res.send(buffer);
    }
    return errorResponse(res, 400, ERR_VALIDATION, 'Formato no soportado');
  } catch (err) {
    next(err);
  }
}

module.exports = { generarReporte, exportarReporte };