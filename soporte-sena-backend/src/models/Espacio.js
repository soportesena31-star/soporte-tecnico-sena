const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Espacio extends Model {}

Espacio.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('aula', 'laboratorio', 'auditorio', 'oficina', 'zona_comun', 'otro', 'ambiente', 'almacen'),
    allowNull: false,
    defaultValue: 'aula',
  },
  sede: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    allowNull: false,
    defaultValue: 'activo',
  },
}, {
  sequelize,
  modelName: 'Espacio',
  tableName: 'espacios',
});

module.exports = Espacio;
