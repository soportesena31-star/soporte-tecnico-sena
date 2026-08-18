const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Catalogo de turnos del panel de horarios: el administrador puede crear
// turnos nuevos (ej. 8-4, 2-9) sin tocar codigo. El turno 8-5 es especial:
// es el unico que se puede asignar al sabado.
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
}, {
  sequelize,
  modelName: 'Horario',
  tableName: 'horarios',
});

module.exports = Horario;
