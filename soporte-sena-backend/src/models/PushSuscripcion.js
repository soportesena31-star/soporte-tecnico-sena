const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Suscripcion Web Push de un dispositivo (celular/escritorio) para recibir
// alertas cuando llega un caso nuevo. El endpoint/claves las entrega el
// navegador (PushManager.subscribe) y se usan con web-push (VAPID).
class PushSuscripcion extends Model {}

PushSuscripcion.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  endpoint: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  p256dh: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  auth: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  user_agent: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'PushSuscripcion',
  tableName: 'push_suscripciones',
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['endpoint'] },
  ],
});

module.exports = PushSuscripcion;
