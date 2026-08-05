const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const c = await mysql.createConnection({
    host: '127.0.0.1', port: 3307, user: 'root',
    password: 'uFiIUovLRPvPrrQDPYrjCDzAgPCaHXFQ', database: 'railway',
    supportBigNumbers: true,
  });

  const [casos] = await c.query('SELECT * FROM casos ORDER BY id');
  const [historial] = await c.query('SELECT * FROM historial_casos ORDER BY id');

  const backup = {
    fecha: new Date().toISOString(),
    casos: casos.map(r => ({ ...r, foto_novedad: r.foto_novedad, foto_evidencia: r.foto_evidencia })),
    historial_casos: historial,
  };

  fs.writeFileSync('C:/Users/SOPORT~1/AppData/Local/Temp/opencode/backup_casos.json', JSON.stringify(backup, null, 2), 'utf8');
  console.log('BACKUP OK');
  console.log('casos:', casos.length, '| historial:', historial.length);
  console.log('fotos en casos:', casos.filter(r => r.foto_novedad || r.foto_evidencia).length);

  await c.end();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
