const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const ESTADOS = ['abierto', 'asignado', 'en_proceso', 'resuelto', 'cerrado', 'reabierto'];

class Caso extends Model {}

Caso.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero_caso: {
    // Se completa en el hook afterCreate de abajo, formato CASO-{anio}-{id}.
    // El numero usa el id global (no reinicia cada enero) para evitar logica
    // transaccional de un contador aparte. Si se necesita que reinicie cada
    // anio, cambiar a una tabla de contadores con bloqueo de fila (SELECT ... FOR UPDATE).
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true,
  },
  espacio_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ubicacion_personalizada: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reportado_por: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  foto_novedad: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM(...ESTADOS),
    allowNull: false,
    defaultValue: 'abierto',
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta'),
    allowNull: false,
    defaultValue: 'media',
  },
  tecnico_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  foto_evidencia: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notas_resolucion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fecha_asignacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_resolucion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  veces_reabierto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: 'Caso',
  tableName: 'casos',
  hooks: {
    afterCreate: async (caso, options) => {
      const anio = new Date(caso.createdAt).getFullYear();
      const numero = `CASO-${anio}-${String(caso.id).padStart(4, '0')}`;
      await caso.update(
        { numero_caso: numero },
        { hooks: false, transaction: options.transaction },
      );
    },
  },
});

Caso.ESTADOS = ESTADOS;

module.exports = Caso;
