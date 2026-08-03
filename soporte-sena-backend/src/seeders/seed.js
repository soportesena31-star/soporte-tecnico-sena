require('dotenv').config();
const {
  sequelize, Categoria, Usuario, Role,
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
