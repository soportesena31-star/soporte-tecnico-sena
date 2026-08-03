require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 4000;

async function iniciar() {
  try {
    await sequelize.authenticate();
    logger.info('Conexion a base de datos exitosa');

    // La estructura de las tablas vive en database/schema.sql (fuente de
    // verdad, con las reglas ON DELETE ya correctas). Por defecto NO se usa
    // sync para crear/alterar tablas. Si de verdad quieres que Sequelize
    // cree las tablas automaticamente en desarrollo, pon DB_AUTO_SYNC=true
    // en el .env — pero ten en cuenta que el DDL que genera Sequelize no
    // siempre replica exactamente las reglas ON DELETE de schema.sql
    // (por ejemplo, tiende a usar CASCADE en vez de RESTRICT en columnas
    // NOT NULL). Para desarrollo local esto rara vez importa; antes de un
    // entorno real, corre schema.sql directamente y deja DB_AUTO_SYNC sin definir.
    if (process.env.DB_AUTO_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      logger.warn('DB_AUTO_SYNC=true: tablas creadas/alteradas por Sequelize (no por schema.sql)');
    }

    app.listen(PORT, () => {
      logger.info(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (err) {
    logger.error('No se pudo iniciar el servidor', { error: err.message });
    process.exit(1);
  }
}

iniciar();
