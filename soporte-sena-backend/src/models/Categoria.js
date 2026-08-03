const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Categoria extends Model {}

Categoria.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
  },
  prioridad_sugerida: {
    type: DataTypes.ENUM('baja', 'media', 'alta'),
    allowNull: false,
    defaultValue: 'media',
  },
}, {
  sequelize,
  modelName: 'Categoria',
  tableName: 'categorias',
});

module.exports = Categoria;
