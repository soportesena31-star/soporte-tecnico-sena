const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Configuracion extends Model {}

Configuracion.init({
  id: {
    type: DataTypes.TINYINT,
    primaryKey: true,
    autoIncrement: false,
    defaultValue: 1,
  },
  notificar_nuevo_caso: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  notificar_asignacion: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  notificar_resolucion: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  notificar_email: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  asignacion_automatica: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'Configuracion',
  tableName: 'configuracion',
  createdAt: false,
  updatedAt: 'updated_at',
});

module.exports = Configuracion;