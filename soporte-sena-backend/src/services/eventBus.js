const logger = require('../config/logger');

// Cola minima de clientes conectados al stream SSE /api/eventos. Cuando el
// backend crea un caso, publica el evento y todos los clientes (paneles
// abiertos de tecnicos/admin) lo reciben en vivo para sonar la alerta.
const clientes = new Set();

function suscribir(res) {
  clientes.add(res);
  logger.info('Cliente SSE conectado', { total: clientes.size });
  return () => clientes.delete(res);
}

function publicar(evento, datos) {
  const payload = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  for (const res of clientes) {
    res.write(payload);
  }
}

module.exports = { suscribir, publicar };
