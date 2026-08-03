Diseña una aplicación web PWA moderna, profesional y responsive para gestionar el soporte técnico de una institución educativa como el SENA.

El sistema debe reemplazar el proceso actual de reportar novedades por WhatsApp y convertirlo en una plataforma centralizada de gestión de casos/tickets.

OBJETIVO PRINCIPAL:
Crear una experiencia rápida, sencilla y clara para que cualquier persona pueda escanear un único código QR ubicado en diferentes zonas de la institución y reportar una novedad desde su celular. El usuario no necesita crear una cuenta.

La plataforma debe funcionar perfectamente en:
- Celulares Android
- iPhone
- Tablets
- Computadores de escritorio

ESTILO VISUAL:
- Diseño moderno, institucional y profesional.
- Inspirado en plataformas modernas de helpdesk y gestión de tickets.
- Interfaz limpia, minimalista y fácil de usar.
- Priorizar accesibilidad y facilidad de uso.
- Diseño mobile-first.
- Usar una identidad visual institucional inspirada en el SENA, sin sobrecargar la interfaz.
- Bordes ligeramente redondeados.
- Tarjetas limpias.
- Iconografía clara.
- Estados visuales mediante badges.
- Excelente jerarquía visual.
- Tipografía moderna y legible.
- Diseño responsive real.

CREAR LAS SIGUIENTES PANTALLAS Y FLUJOS:

1. PÁGINA DE REPORTAR NOVEDAD - MOBILE

Esta es la pantalla que aparece después de escanear el único código QR.

Mostrar:
- Logo institucional.
- Título: "Reportar novedad"
- Texto: "Ayúdanos a solucionar rápidamente cualquier inconveniente."
- Selector de ubicación/espacio.
- El usuario debe poder buscar y seleccionar dónde se encuentra.
- Organizar espacios por categorías:
  - Aulas
  - Laboratorios
  - Auditorios
  - Oficinas
  - Zonas comunes
  - Otros
- Campo "Nombre de quien reporta".
- Campo "Tipo de novedad".
- Opciones como:
  - Equipos de cómputo
  - Conectividad / Red
  - Mobiliario
  - Eléctrico
  - Audiovisuales
  - Climatización
  - Otro
- Campo de descripción del problema.
- Botón para tomar o adjuntar una fotografía de la novedad.
- Botón principal grande: "Enviar reporte".

La pantalla debe ser extremadamente sencilla para completar el reporte en menos de un minuto.

2. CONFIRMACIÓN DEL REPORTE

Después de enviar el formulario mostrar una pantalla de éxito.

Mostrar:
- Icono de éxito.
- Texto: "Reporte enviado correctamente".
- Número de caso destacado:
  "CASO-2026-0034"
- Fecha y hora.
- Ubicación.
- Tipo de novedad.
- Estado: "Abierto".
- Botón "Consultar estado del caso".
- Botón "Reportar otra novedad".

Incluir una explicación:
"Guarda este número para consultar el avance de tu solicitud."

3. CONSULTA DE CASO / TRACKING

Crear una pantalla pública donde el usuario pueda consultar el estado de su caso sin iniciar sesión.

Mostrar:
- Campo para introducir número de caso.
- Ejemplo: CASO-2026-0034.
- Timeline visual del caso:
  1. Reportado
  2. Asignado
  3. En proceso
  4. Resuelto
  5. Cerrado

Si el caso está reabierto mostrar:
- Estado "Reabierto".

Mostrar información:
- Número de caso.
- Ubicación.
- Categoría.
- Descripción.
- Fecha de creación.
- Técnico asignado, si existe.
- Última actualización.
- Evidencia de solución cuando corresponda.

4. LOGIN PARA TÉCNICOS Y ADMINISTRADORES

Crear una pantalla de inicio de sesión profesional.

Campos:
- Correo electrónico.
- Contraseña.
- Recordarme.
- Recuperar contraseña.

Roles:
- Técnico.
- Administrador.

5. PANEL DEL TÉCNICO - MOBILE FIRST

Crear un dashboard optimizado para técnicos que trabajan principalmente desde el celular.

Mostrar:
- Saludo: "Hola, Carlos".
- Resumen de casos:
  - Nuevos
  - Disponibles
  - Mis casos
  - En proceso
  - Resueltos

Crear una lista de casos con tarjetas.

Cada tarjeta debe mostrar:
- Número de caso.
- Prioridad.
- Estado.
- Categoría.
- Ubicación.
- Descripción corta.
- Fecha y hora.
- Persona que reportó.

Agregar filtros:
- Todos.
- Nuevos.
- Alta prioridad.
- Mis casos.
- En proceso.

6. DETALLE DEL CASO PARA TÉCNICO

Mostrar toda la información del caso.

Información:
- CASO-2026-0034.
- Estado actual.
- Prioridad.
- Ubicación.
- Categoría.
- Persona que reportó.
- Fecha de creación.
- Descripción.
- Foto de la novedad.

Botón destacado:
"Tomar caso"

Al pulsarlo:
- Registrar automáticamente el nombre del técnico.
- Registrar fecha y hora.
- Cambiar estado a "Asignado".
- Mostrar claramente:
  "Responsable: Carlos Pérez"

Después permitir:
- Cambiar a "En proceso".
- Agregar notas.
- Tomar/subir foto de evidencia de la solución.
- Marcar como "Resuelto".

La foto de evidencia debe ser obligatoria para poder marcar el caso como resuelto.

Mostrar un historial/timeline:
- Caso creado.
- Caso tomado por técnico.
- Caso iniciado.
- Solución registrada.
- Evidencia adjunta.
- Caso resuelto.

7. PANEL DE ADMINISTRADOR - DESKTOP

Crear un dashboard completo para administración.

Sidebar lateral con:
- Dashboard
- Casos
- Espacios
- Técnicos
- Categorías
- Reportes
- Historial
- Configuración

Dashboard principal con métricas:
- Total de casos.
- Casos abiertos.
- Casos en proceso.
- Casos resueltos.
- Casos cerrados.
- Casos reabiertos.
- Tiempo promedio de resolución.

Agregar gráficos:
- Casos por período.
- Casos por categoría.
- Casos por espacio.
- Casos por técnico.
- Casos por estado.
- Evolución de casos durante el tiempo.

8. GESTIÓN DE CASOS PARA ADMINISTRADOR

Crear una tabla profesional de tickets.

Columnas:
- Número.
- Fecha.
- Espacio.
- Categoría.
- Prioridad.
- Reportado por.
- Técnico asignado.
- Estado.
- Tiempo de resolución.
- Acciones.

Agregar:
- Búsqueda.
- Filtros.
- Ordenamiento.
- Paginación.

Crear vista detallada del caso con todo su historial.

9. GESTIÓN DE ESPACIOS

Crear pantalla para administrar los lugares de la institución.

Tipos:
- Aula.
- Laboratorio.
- Auditorio.
- Oficina.
- Zona común.
- Otro.

Permitir:
- Crear espacio.
- Editar espacio.
- Activar/desactivar espacio.
- Buscar espacios.
- Filtrar por tipo.
- Filtrar por sede.

IMPORTANTE:
El sistema utiliza UN ÚNICO CÓDIGO QR GENERAL para acceder al formulario de reporte. El QR NO identifica automáticamente un aula específica.

Por lo tanto, después de escanear el QR, el usuario debe seleccionar manualmente el espacio donde se encuentra.

10. REPORTES

Crear una sección de reportes administrativos.

Permitir seleccionar:
- Fecha inicial.
- Fecha final.
- Sede.
- Espacio.
- Categoría.
- Técnico.
- Estado.

Mostrar resumen estadístico y gráficos.

Botones:
- Exportar Excel.
- Exportar PDF.

El administrador debe poder generar reportes de los últimos 15 o 30 días.

11. EXPERIENCIA MOBILE

Diseñar una navegación móvil especialmente para técnicos.

Usar:
- Bottom navigation.
- Inicio.
- Casos.
- Mis casos.
- Notificaciones.
- Perfil.

Las acciones principales deben estar al alcance del pulgar.

El técnico debe poder:
- Ver casos.
- Tomar un caso.
- Cambiar estado.
- Escribir notas.
- Tomar una fotografía con la cámara del celular.
- Subir evidencia.
- Resolver el caso.

Todo debe poder realizarse desde Android y iPhone.

12. ESTADOS DEL SISTEMA

Utilizar los siguientes estados:
- Abierto.
- Asignado.
- En proceso.
- Resuelto.
- Cerrado.
- Reabierto.

Usar badges visuales y consistentes para diferenciar cada estado.

13. PRIORIDADES

Crear:
- Baja.
- Media.
- Alta.

La prioridad puede ser sugerida automáticamente según la categoría, pero el administrador o técnico autorizado puede modificarla.

14. DISEÑO DEL SISTEMA

Crear un Design System básico con:
- Colores institucionales.
- Tipografía.
- Botones.
- Inputs.
- Selectores.
- Dropdowns.
- Cards.
- Badges de estado.
- Badges de prioridad.
- Tablas.
- Modales.
- Alertas.
- Toast notifications.
- Timeline.
- Empty states.
- Loading states.
- Error states.

Crear componentes reutilizables y mantener consistencia visual entre todas las pantallas.

Crear prototipo navegable de los principales flujos:

FLUJO 1:
Escanear QR → Reportar novedad → Seleccionar espacio → Enviar → Recibir número de caso → Consultar estado.

FLUJO 2:
Técnico inicia sesión → Ve casos disponibles → Abre caso → Toma caso → Se convierte en responsable → Inicia trabajo → Agrega notas → Toma foto de evidencia → Resuelve caso.

FLUJO 3:
Administrador inicia sesión → Dashboard → Consulta casos → Filtra → Revisa detalles → Genera reporte.

El resultado debe parecer un producto real listo para convertirse en una aplicación PWA profesional, no un simple mockup. Diseñar primero la experiencia mobile y después adaptar el dashboard administrativo a desktop.