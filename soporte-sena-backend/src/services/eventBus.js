const logger = require('../config/logger');

// Cola minima de clientes conectados al stream SSE /api/eventos. Cuando el
// backend crea un caso, publica el evento y todos los clientes (paneles
// abiertos de tecnicos/admin) lo reciben en vivo para sonar la alerta.
const clientes = new Set();

// Heartbeat: algunos proxies (ej. Railway) cortan conexiones SSE inactivas.
// Un comentario ': ping' cada 25s la mantiene viva sin generar eventos.
const INTERVALO_HEARTBEAT_MS = 25_000;
let heartbeat = null;

function suscribir(res) {
  clientes.add(res);
  logger.info('Cliente SSE conectado', { total: clientes.size });
  if (!heartbeat) {
    heartbeat = setInterval(() => {
      for (const r of clientes) {
        try {
          r.write(': ping\n\n');
        } catch {
          // Socket muerto: la limpieza la hace el evento 'close' del req.
        }
      }
    }, INTERVALO_HEARTBEAT_MS);
  }
  return () => {
    clientes.delete(res);
    if (clientes.size === 0 && heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };
}

function publicar(evento, datos) {
  const payload = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  for (const res of clientes) {
    try {
      res.write(payload);
    } catch {
      clientes.delete(res);
    }
  }
}

module.exports = { suscribir, publicar };
