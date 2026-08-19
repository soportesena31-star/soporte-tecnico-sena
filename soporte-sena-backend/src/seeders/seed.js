require('dotenv').config();
const { Op } = require('sequelize');
const {
  sequelize, Categoria, Usuario, Role, Horario,
} = require('../models');

const ROLES = [
  { nombre: 'tecnico', descripcion: 'Atiende, toma y resuelve casos de soporte tecnico' },
  { nombre: 'administrador', descripcion: 'Gestiona espacios, tecnicos, categorias y reportes' },
];

const CATEGORIAS = [
  { nombre: 'Eléctrico', prioridad_sugerida: 'alta' },
  { nombre: 'Conectividad / Red', prioridad_sugerida: 'alta' },
  { nombre: 'Equipos de cómputo', prioridad_sugerida: 'media' },
  { nombre: 'Mobiliario', prioridad_sugerida: 'baja' },
  { nombre: 'Audiovisuales', prioridad_sugerida: 'media' },
  { nombre: 'Climatización', prioridad_sugerida: 'media' },
  { nombre: 'Otro', prioridad_sugerida: 'baja' },
];

// Turnos base del panel de horarios. El 8-4 es el turno fijo de sabado
// (fijo_sabado=true): es el unico que se puede asignar al sabado, regla que
// aplica el backend. El seed re-marca siempre el 8-4 como fijo para que el
// catalogo quede coherente aunque el admin haya movido el flag en algun momento.
const HORARIOS = [
  { nombre: '6-2', hora_inicio: '06:00', hora_fin: '14:00' },
  { nombre: '7-4', hora_inicio: '07:00', hora_fin: '16:00' },
  { nombre: '8-5', hora_inicio: '08:00', hora_fin: '17:00' },
  { nombre: '8-4', hora_inicio: '08:00', hora_fin: '16:00', fijo_sabado: true },
  { nombre: '2-9', hora_inicio: '14:00', hora_fin: '21:00' },
];

async function seed() {
  await sequelize.authenticate();

  for (const rol of ROLES) {
    await Role.findOrCreate({ where: { nombre: rol.nombre }, defaults: rol });
  }
  console.log('Roles listos');

  for (const cat of CATEGORIAS) {
    await Categoria.findOrCreate({ where: { nombre: cat.nombre }, defaults: cat });
  }
  console.log('Categorias listas');

  for (const h of HORARIOS) {
    await Horario.findOrCreate({ where: { nombre: h.nombre }, defaults: h });
  }
  // Garantiza el unico turno fijo de sabado (idempotente).
  await Horario.update({ fijo_sabado: false }, { where: { nombre: { [Op.ne]: '8-4' } } });
  await Horario.update({ fijo_sabado: true }, { where: { nombre: '8-4' } });
  console.log('Turnos base listos');

  const rolAdmin = await Role.findOne({ where: { nombre: 'administrador' } });
  const rolTecnico = await Role.findOne({ where: { nombre: 'tecnico' } });

  const [, creado] = await Usuario.findOrCreate({
    where: { email: 'admin@sena.edu.co' },
    defaults: {
      nombre: 'Administrador',
      email: 'admin@sena.edu.co',
      password_hash: 'cambiar123',
      rol_id: rolAdmin.id,
    },
  });

  if (creado) {
    console.log('Usuario administrador creado: admin@sena.edu.co / cambiar123 (cambia esta contrasena)');
  } else {
    console.log('El usuario administrador ya existia');
  }

  // Tecnicos de prueba para desarrollo. En produccion se crean por invitacion
  // desde el panel admin (Tecnicos -> Invitar), que envia un enlace por correo.
  const TECNICOS = [
    { nombre: 'Tecnico Uno', email: 'tecnico1@sena.edu.co', especialidad: 'Redes y conectividad' },
    { nombre: 'Tecnico Dos', email: 'tecnico2@sena.edu.co', especialidad: 'Equipos de computo' },
  ];
  for (const t of TECNICOS) {
    const [, creadoTec] = await Usuario.findOrCreate({
      where: { email: t.email },
      defaults: {
        nombre: t.nombre,
        email: t.email,
        password_hash: 'cambiar123',
        rol_id: rolTecnico.id,
        especialidad: t.especialidad,
        activo: true,
      },
    });
    if (creadoTec) console.log(`Tecnico creado: ${t.email} / cambiar123`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
