const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: '127.0.0.1', port: 3307, user: 'root',
    password: 'uFiIUovLRPvPrrQDPYrjCDzAgPCaHXFQ', database: 'railway',
  });

  // 1. Historial primero (FK a casos)
  const [h] = await c.query('DELETE FROM historial_casos');
  // 2. Casos
  const [k] = await c.query('DELETE FROM casos');
  // 3. Reset contadores
  await c.query('ALTER TABLE historial_casos AUTO_INCREMENT = 1');
  await c.query('ALTER TABLE casos AUTO_INCREMENT = 1');

  console.log('historial_casos borrados:', h.affectedRows);
  console.log('casos borrados:', k.affectedRows);

  // Verificacion: tablas que deben quedar intactas
  const [roles] = await c.query('SELECT COUNT(*) total FROM roles');
  const [usuarios] = await c.query('SELECT COUNT(*) total FROM usuarios');
  const [espacios] = await c.query('SELECT COUNT(*) total FROM espacios');
  const [categorias] = await c.query('SELECT COUNT(*) total FROM categorias');
  const [config] = await c.query('SELECT COUNT(*) total FROM configuracion');
  console.log('intactas -> roles:', roles[0].total, '| usuarios:', usuarios[0].total, '| espacios:', espacios[0].total, '| categorias:', categorias[0].total, '| configuracion:', config[0].total);

  const [vacia] = await c.query('SELECT COUNT(*) total FROM casos');
  console.log('casos restantes:', vacia[0].total);

  await c.end();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
