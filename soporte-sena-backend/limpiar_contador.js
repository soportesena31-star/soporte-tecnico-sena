const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: '127.0.0.1', port: 3307, user: 'root',
    password: 'uFiIUovLRPvPrrQDPYrjCDzAgPCaHXFQ', database: 'railway',
  });

  await c.query('DELETE FROM historial_casos');
  await c.query('DELETE FROM casos');
  await c.query('ALTER TABLE historial_casos AUTO_INCREMENT = 1');
  await c.query('ALTER TABLE casos AUTO_INCREMENT = 1');

  const [v] = await c.query('SELECT COUNT(*) total FROM casos');
  const [n] = await c.query('SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = "railway" AND TABLE_NAME = "casos"');
  console.log('casos restantes:', v[0].total, '| proximo AUTO_INCREMENT:', n[0].AUTO_INCREMENT);
  await c.end();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
