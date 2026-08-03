const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class HistorialCaso extends Model {}

HistorialCaso.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  caso_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  accion: {
    type: DataTypes.ENUM('creado', 'asignado', 'en_proceso', 'nota', 'resuelto', 'cerrado', 'reabierto'),
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  detalle: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'HistorialCaso',
  tableName: 'historial_casos',
  updatedAt: false,
});

module.exports = HistorialCaso;
