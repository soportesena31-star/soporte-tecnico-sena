const crypto = require('crypto');

/**
 * Genera un token aleatorio de alta entropia (32 bytes = 256 bits) y su
 * hash SHA-256. El token en claro se manda por correo y nunca se guarda;
 * solo el hash vive en la base de datos. Al validar, se hashea el token
 * que llega y se compara contra el hash guardado.
 */
function generarToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

function hashearToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { generarToken, hashearToken };
