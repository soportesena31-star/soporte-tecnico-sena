const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class TokenAcceso extends Model {
  haExpirado() {
    return new Date() > new Date(this.expira_at);
  }

  estaUsado() {
    return this.usado_at !== null;
  }
}

TokenAcceso.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo: {
    type: DataTypes.ENUM('invitacion', 'restablecimiento'),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  token_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  nombre_invitado: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  usado_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expira_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'TokenAcceso',
  tableName: 'tokens_acceso',
  updatedAt: false,
});

module.exports = TokenAcceso;
