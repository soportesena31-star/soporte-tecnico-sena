const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Catalogo de turnos del panel de horarios: el administrador puede crear
// turnos nuevos (ej. 8-4, 2-9) sin tocar codigo. El flag fijo_sabado marca
// el UNICO turno que se puede asignar al sabado (regla de cobertura: el
// sabado lo cubren 1 o 2 tecnicos con ese turno). La regla la aplica el
// backend; el frontend solo la refleja en la UI.
class Horario extends Model {}

Horario.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  fijo_sabado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'Horario',
  tableName: 'horarios',
});

module.exports = Horario;
