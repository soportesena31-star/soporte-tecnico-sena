const sequelize = require('../config/database');
const Espacio = require('./Espacio');
const Categoria = require('./Categoria');
const Role = require('./Role');
const Usuario = require('./Usuario');
const Caso = require('./Caso');
const HistorialCaso = require('./HistorialCaso');
const TokenAcceso = require('./TokenAcceso');
const Configuracion = require('./Configuracion');

// El alias 'rol' es a proposito: usuario.rol devuelve la instancia de Role
// completa cuando esta incluida, y Usuario.toJSON() la aplana a un string
// antes de salir por la API, asi que el contrato con el frontend no cambia.
Role.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
Usuario.belongsTo(Role, {
  foreignKey: 'rol_id', as: 'rol', onDelete: 'RESTRICT', onUpdate: 'CASCADE',
});

// onDelete/onUpdate se declaran explicitos para que coincidan siempre con
// database/schema.sql. Sin esto, Sequelize asume CASCADE por defecto en
// cualquier FK NOT NULL, y aqui NO se quiere: borrar un espacio o una
// categoria jamas debe arrastrar en cascada el historial de casos.
Espacio.hasMany(Caso, { foreignKey: 'espacio_id', as: 'casos' });
Caso.belongsTo(Espacio, {
  foreignKey: 'espacio_id', as: 'espacio', onDelete: 'RESTRICT', onUpdate: 'CASCADE',
});

Categoria.hasMany(Caso, { foreignKey: 'categoria_id', as: 'casos' });
Caso.belongsTo(Categoria, {
  foreignKey: 'categoria_id', as: 'categoria', onDelete: 'RESTRICT', onUpdate: 'CASCADE',
});

Usuario.hasMany(Caso, { foreignKey: 'tecnico_id', as: 'casosAsignados' });
Caso.belongsTo(Usuario, {
  foreignKey: 'tecnico_id', as: 'tecnico', onDelete: 'SET NULL', onUpdate: 'CASCADE',
});

Caso.hasMany(HistorialCaso, { foreignKey: 'caso_id', as: 'historial' });
HistorialCaso.belongsTo(Caso, {
  foreignKey: 'caso_id', as: 'caso', onDelete: 'CASCADE', onUpdate: 'CASCADE',
});

Usuario.hasMany(HistorialCaso, { foreignKey: 'usuario_id', as: 'acciones' });
HistorialCaso.belongsTo(Usuario, {
  foreignKey: 'usuario_id', as: 'usuario', onDelete: 'SET NULL', onUpdate: 'CASCADE',
});

Usuario.hasMany(TokenAcceso, { foreignKey: 'usuario_id', as: 'tokens' });
TokenAcceso.belongsTo(Usuario, {
  foreignKey: 'usuario_id', as: 'usuario', onDelete: 'CASCADE', onUpdate: 'CASCADE',
});
Role.hasMany(TokenAcceso, { foreignKey: 'rol_id', as: 'invitaciones' });
TokenAcceso.belongsTo(Role, {
  foreignKey: 'rol_id', as: 'rolPropuesto', onDelete: 'RESTRICT', onUpdate: 'CASCADE',
});

module.exports = {
  sequelize,
  Espacio,
  Categoria,
  Role,
  Usuario,
  Caso,
  HistorialCaso,
  TokenAcceso,
  Configuracion,
};
