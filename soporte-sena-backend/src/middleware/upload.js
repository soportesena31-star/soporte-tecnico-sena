const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Firmas (magic bytes) de los formatos de imagen admitidos. Se verifica el
// contenido real del archivo y no solo el Content-Type, que el cliente puede
// falsificar facilmente.
const PNG_FIRMA = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function coincide(buffer, bytes) {
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[i] !== bytes[i]) return false;
  }
  return true;
}

function esImagenValida(buffer) {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (coincide(buffer, [0xff, 0xd8, 0xff])) return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (coincide(buffer, PNG_FIRMA)) return true;

  // GIF: "GIF87a" o "GIF89a"
  if (coincide(buffer, [0x47, 0x49, 0x46, 0x38])) {
    const version = buffer.toString('latin1', 4, 6);
    if (version === '87' || version === '89') return true;
  }

  // WebP: "RIFF" .... "WEBP"
  if (coincide(buffer, [0x52, 0x49, 0x46, 0x46]) && buffer.toString('latin1', 8, 12) === 'WEBP') return true;

  // BMP: "BM"
  if (coincide(buffer, [0x42, 0x4d])) return true;

  // AVIF / HEIF: caja "ftyp" con brand conocido
  if (buffer.toString('latin1', 4, 8) === 'ftyp') {
    const brand = buffer.toString('latin1', 8, 12);
    if (['avif', 'avis', 'mif1', 'msf1', 'heic', 'heix'].includes(brand)) return true;
  }

  return false;
}

// Almacenamiento custom: valida el contenido antes de escribir en disco. La API
// de multer no cambia, asi que los controladores y rutas siguen igual.
const storage = {
  _handleFile(req, file, cb) {
    const chunks = [];
    file.stream.on('data', (chunk) => chunks.push(chunk));
    file.stream.on('error', (err) => cb(err));
    file.stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      if (buffer.length === 0) {
        return cb(new Error('El archivo esta vacio'));
      }
      if (!esImagenValida(buffer)) {
        return cb(new Error('El archivo no es una imagen valida'));
      }
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      const ruta = path.join(uploadDir, filename);
      fs.writeFile(ruta, buffer, (err) => {
        if (err) return cb(err);
        cb(null, { destination: uploadDir, filename, path: ruta, size: buffer.length });
      });
    });
  },
  _removeFile(req, file, cb) {
    const ruta = file.path || path.join(uploadDir, file.filename || '');
    fs.unlink(ruta, () => cb(null));
  },
};

function soloImagenes(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Solo se permiten archivos de imagen'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: soloImagenes,
  // Las fotos tomadas con celulares modernos superan facilmente los 5MB.
  limits: { fileSize: 15 * 1024 * 1024 },
});

module.exports = upload;
