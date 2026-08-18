const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Grilla semanal de cada tecnico (panel de horarios del administrador).
// Una fila por (tecnico, dia, semana); dia_semana 1=Lunes ... 6=Sabado.
// 'descanso' = el tecnico no trabaja ese dia; 'horario_id' NULL con
// descanso=false significa que todavia no se definio ese dia.
class HorarioTecnico extends Model {}

HorarioTecnico.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tecnico_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dia_semana: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: { min: 1, max: 7 },
  },
  horario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  descanso: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  semana: {
    // Fecha del lunes de la semana (YYYY-MM-DD): identifica la semana
    // laboral; el panel navega semanas anteriores y futuras.
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'HorarioTecnico',
  tableName: 'horarios_tecnicos',
  indexes: [
    {
      unique: true,
      fields: ['tecnico_id', 'dia_semana', 'semana'],
      name: 'uk_tecnico_dia_semana',
    },
  ],
});

module.exports = HorarioTecnico;