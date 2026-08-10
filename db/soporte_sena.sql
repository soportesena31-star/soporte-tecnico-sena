-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 07-08-2026 a las 00:40:13
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `soporte_sena`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `casos`
--

CREATE TABLE `casos` (
  `id` int(10) UNSIGNED NOT NULL,
  `numero_caso` varchar(30) DEFAULT NULL COMMENT 'Ej: CASO-2026-0034, se completa despues del insert',
  `espacio_id` int(11) DEFAULT NULL,
  `ubicacion_personalizada` varchar(255) DEFAULT NULL,
  `categoria_id` int(10) UNSIGNED NOT NULL,
  `reportado_por` varchar(150) NOT NULL COMMENT 'Nombre libre, sin FK a usuarios',
  `descripcion` text NOT NULL,
  `foto_novedad` text DEFAULT NULL,
  `estado` enum('abierto','asignado','en_proceso','resuelto','cerrado','reabierto') NOT NULL DEFAULT 'abierto',
  `prioridad` enum('baja','media','alta') NOT NULL DEFAULT 'media',
  `tecnico_id` int(10) UNSIGNED DEFAULT NULL,
  `foto_evidencia` text DEFAULT NULL,
  `notas_resolucion` text DEFAULT NULL,
  `fecha_asignacion` datetime DEFAULT NULL,
  `fecha_resolucion` datetime DEFAULT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `veces_reabierto` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `casos`
--

INSERT INTO `casos` (`id`, `numero_caso`, `espacio_id`, `ubicacion_personalizada`, `categoria_id`, `reportado_por`, `descripcion`, `foto_novedad`, `estado`, `prioridad`, `tecnico_id`, `foto_evidencia`, `notas_resolucion`, `fecha_asignacion`, `fecha_resolucion`, `fecha_cierre`, `veces_reabierto`, `created_at`, `updated_at`) VALUES
(1, 'CASO-2026-0001', 1, NULL, 5, 'martina mendez', 'no hay sonido en el auditorio C', '[\"1.jfif\"]', 'resuelto', 'media', 2, '[\"2.jfif\"]', '', '2026-07-31 16:29:46', '2026-07-31 16:33:42', NULL, 0, '2026-07-31 16:28:12', '2026-08-03 20:52:19'),
(2, 'CASO-2026-0002', NULL, 'pasillo 3n piso', 7, 'juan perez', 'televisor pasillo', '[\"2.jfif\"]', 'resuelto', 'baja', 2, '[\"3.jfif\"]', 'gdfgdegfr', '2026-07-31 18:58:29', '2026-07-31 19:15:49', NULL, 0, '2026-07-31 18:56:59', '2026-08-03 20:52:20'),
(3, 'CASO-2026-0003', 1, NULL, 2, 'martha mora', 'no tengo internet', '[\"3.jfif\"]', 'resuelto', 'alta', 2, '[\"1785793830346-267370071.jpg\"]', 'Equipo conectado a la red', '2026-08-03 15:34:55', '2026-08-03 21:50:30', NULL, 0, '2026-07-31 19:19:01', '2026-08-03 21:50:30'),
(4, 'CASO-2026-0004', 2, NULL, 5, 'Daniel garcia', 'poner un tv en la cancha de futbol', '[\"1.jfif\",\"2.jfif\"]', 'en_proceso', 'media', 2, '[\"3.jfif\"]', NULL, '2026-08-03 16:11:12', NULL, NULL, 0, '2026-08-03 16:09:23', '2026-08-03 21:52:55'),
(5, 'CASO-2026-0005', 2, NULL, 1, 'Tester', 'Test case multi foto', '[\"2.jfif\",\"3.jfif\"]', 'resuelto', 'alta', 2, '[\"1785795488114-52364037.jpg\"]', 'Equipo conectado a la red', '2026-08-03 22:16:16', '2026-08-03 22:18:08', NULL, 0, '2026-08-03 16:39:21', '2026-08-03 22:18:08'),
(6, 'CASO-2026-0006', 2, NULL, 1, 'Tester', 'Test case with 3 fotos', '[\"1.jfif\",\"2.jfif\",\"3.jfif\"]', 'resuelto', 'alta', 3, '[\"1785793829569-161441950.png\"]', 'prueba con campo notas_resolucion final', '2026-08-03 19:40:57', '2026-08-03 21:50:29', NULL, 0, '2026-08-03 16:45:55', '2026-08-03 21:50:29'),
(7, 'CASO-2026-0007', NULL, 'Prueba automatica', 5, 'Prueba Local IA', 'Caso de prueba creado por el flujo de verificacion del deep-link push.', NULL, 'abierto', 'media', NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-08-06 17:43:46', '2026-08-06 17:43:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `prioridad_sugerida` enum('baja','media','alta') NOT NULL DEFAULT 'media',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Categorias de novedad con prioridad sugerida';

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `prioridad_sugerida`, `created_at`, `updated_at`) VALUES
(1, 'Eléctrico', 'alta', '2026-07-31 12:19:57', '2026-07-31 12:19:57'),
(2, 'Conectividad / Red', 'alta', '2026-07-31 12:19:57', '2026-07-31 12:19:57'),
(3, 'Equipos de cómputo', 'media', '2026-07-31 12:19:57', '2026-07-31 12:19:57'),
(4, 'Mobiliario', 'baja', '2026-07-31 12:19:57', '2026-07-31 12:19:57'),
(5, 'Audiovisuales', 'media', '2026-07-31 12:19:57', '2026-07-31 12:19:57'),
(6, 'Climatización', 'media', '2026-07-31 12:19:57', '2026-07-31 12:19:57'),
(7, 'Otro', 'baja', '2026-07-31 12:19:57', '2026-07-31 12:19:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id` tinyint(4) NOT NULL,
  `notificar_nuevo_caso` tinyint(1) NOT NULL DEFAULT 1,
  `notificar_asignacion` tinyint(1) NOT NULL DEFAULT 1,
  `notificar_resolucion` tinyint(1) NOT NULL DEFAULT 0,
  `notificar_email` tinyint(1) NOT NULL DEFAULT 1,
  `asignacion_automatica` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id`, `notificar_nuevo_caso`, `notificar_asignacion`, `notificar_resolucion`, `notificar_email`, `asignacion_automatica`, `updated_at`) VALUES
(1, 1, 1, 0, 0, 0, '2026-08-03 20:38:41');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `espacios`
--

CREATE TABLE `espacios` (
  `id` int(10) UNSIGNED NOT NULL,
  `codigo` varchar(20) DEFAULT NULL COMMENT 'Codigo interno opcional, ej: A-101',
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre visible, ej: Auditorio Principal',
  `tipo` enum('aula','laboratorio','auditorio','oficina','zona_comun','otro') NOT NULL DEFAULT 'aula',
  `sede` varchar(100) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Aulas, laboratorios, auditorios y demas espacios del campus';

--
-- Volcado de datos para la tabla `espacios`
--

INSERT INTO `espacios` (`id`, `codigo`, `nombre`, `tipo`, `sede`, `estado`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Ambiente304', 'aula', 'Principal', 'activo', '2026-07-31 12:44:36', '2026-07-31 12:44:36'),
(2, NULL, 'ambiente301', 'aula', 'Principal', 'activo', '2026-07-31 19:02:30', '2026-07-31 19:02:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_casos`
--

CREATE TABLE `historial_casos` (
  `id` int(10) UNSIGNED NOT NULL,
  `caso_id` int(10) UNSIGNED NOT NULL,
  `accion` enum('creado','asignado','en_proceso','nota','resuelto','cerrado','reabierto') NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'NULL cuando la accion la origina quien reporta, sin cuenta',
  `detalle` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bitacora de auditoria de cada caso';

--
-- Volcado de datos para la tabla `historial_casos`
--

INSERT INTO `historial_casos` (`id`, `caso_id`, `accion`, `usuario_id`, `detalle`, `created_at`) VALUES
(1, 1, 'creado', NULL, 'Reportado por martina mendez', '2026-07-31 16:28:12'),
(2, 1, 'asignado', 2, NULL, '2026-07-31 16:29:46'),
(3, 1, 'en_proceso', 2, NULL, '2026-07-31 16:30:19'),
(4, 1, 'nota', 2, 'se revisa consola y conexión, se realizan ajustes y queda todo funcionando', '2026-07-31 16:33:38'),
(5, 1, 'resuelto', 2, '', '2026-07-31 16:33:42'),
(6, 2, 'creado', NULL, 'Reportado por juan perez', '2026-07-31 18:56:59'),
(7, 2, 'asignado', 2, 'Tomado por migue perez', '2026-07-31 18:58:29'),
(8, 2, 'en_proceso', 2, 'Trabajo iniciado por migue perez', '2026-07-31 18:58:33'),
(9, 2, 'nota', 2, 'ljhcdwejcbfidbg', '2026-07-31 18:59:25'),
(10, 2, 'resuelto', 2, 'gdfgdegfr', '2026-07-31 19:15:49'),
(11, 3, 'creado', NULL, 'Reportado por martha mora', '2026-07-31 19:19:01'),
(12, 3, 'asignado', 1, 'Asignado manualmente por el administrador a migue perez', '2026-08-03 15:03:02'),
(13, 3, 'asignado', 1, 'Asignado manualmente por el administrador a migue perez', '2026-08-03 15:34:55'),
(14, 4, 'creado', NULL, 'Reportado por Daniel garcia', '2026-08-03 16:09:23'),
(15, 4, 'asignado', 1, 'Asignado manualmente por el administrador a migue perez', '2026-08-03 16:11:12'),
(16, 5, 'creado', NULL, 'Reportado por Tester', '2026-08-03 16:39:21'),
(17, 6, 'creado', NULL, 'Reportado por Tester', '2026-08-03 16:45:55'),
(18, 6, 'asignado', 3, NULL, '2026-08-03 19:40:57'),
(19, 3, 'en_proceso', 2, NULL, '2026-08-03 21:42:04'),
(20, 3, 'nota', 2, 'Equipo conectado a la red', '2026-08-03 21:47:05'),
(21, 6, 'resuelto', 1, 'prueba con campo notas_resolucion final', '2026-08-03 21:50:29'),
(22, 3, 'resuelto', 2, 'Equipo conectado a la red', '2026-08-03 21:50:30'),
(23, 4, 'en_proceso', 2, NULL, '2026-08-03 21:52:55'),
(24, 5, 'asignado', 2, NULL, '2026-08-03 22:16:16'),
(25, 5, 'en_proceso', 2, NULL, '2026-08-03 22:16:22'),
(26, 5, 'resuelto', 2, 'Equipo conectado a la red', '2026-08-03 22:18:08'),
(27, 7, 'creado', NULL, 'Reportado por Prueba Local IA', '2026-08-06 17:43:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `push_suscripciones`
--

CREATE TABLE `push_suscripciones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(30) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Roles de usuario del sistema';

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'tecnico', 'Atiende, toma y resuelve casos de soporte tecnico', '2026-07-31 12:19:57', '2026-07-31 12:19:57'),
(2, 'administrador', 'Gestiona espacios, tecnicos, categorias y reportes', '2026-07-31 12:19:57', '2026-07-31 12:19:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tokens_acceso`
--

CREATE TABLE `tokens_acceso` (
  `id` int(10) UNSIGNED NOT NULL,
  `tipo` enum('invitacion','restablecimiento') NOT NULL,
  `email` varchar(150) NOT NULL,
  `token_hash` char(64) NOT NULL COMMENT 'SHA-256 hex del token enviado por correo',
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `rol_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'Solo invitacion: rol propuesto para la cuenta nueva',
  `nombre_invitado` varchar(100) DEFAULT NULL COMMENT 'Solo invitacion: nombre propuesto para la cuenta nueva',
  `usado_at` datetime DEFAULT NULL,
  `expira_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invitaciones de cuenta y restablecimiento de contrasena, de un solo uso';

--
-- Volcado de datos para la tabla `tokens_acceso`
--

INSERT INTO `tokens_acceso` (`id`, `tipo`, `email`, `token_hash`, `usuario_id`, `rol_id`, `nombre_invitado`, `usado_at`, `expira_at`, `created_at`) VALUES
(1, 'invitacion', 'soportesena31@gmail.com', '2910d214bfa92af8c2dc4d8c8246458b4d4ce70ccc7ef865f0347c8e7495efa1', 2, 1, 'migue perez', '2026-07-31 14:03:16', '2026-08-02 14:01:41', '2026-07-31 14:01:41'),
(2, 'restablecimiento', 'soportesena31@gmail.com', '35daf64fa1dd655e02dacaf8982ea22c59e3f1b0ede55853be0687643fe4dca8', 2, NULL, NULL, NULL, '2026-07-31 17:37:37', '2026-07-31 16:37:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'Hash bcrypt, nunca texto plano',
  `rol_id` int(10) UNSIGNED NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL COMMENT 'Ej: electrico, redes - uso futuro para enrutar casos',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tecnicos y administrador del sistema';

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol_id`, `especialidad`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Administrador', 'admin@sena.edu.co', '$2a$10$rwfDLIgyWMikNVFfSrlVAO6wEhhJ2tWQRWIFD5pG2XnhRj.orreoG', 2, NULL, 1, '2026-07-31 12:34:13', '2026-08-03 20:32:08'),
(2, 'miguel perez', 'soportesena31@gmail.com', '$2a$10$hXqJE.nqHQh14sh.vVc71.lS3g1G715bWbKYmwaYrH9/nJiR5Xz5y', 1, NULL, 1, '2026-07-31 14:03:16', '2026-08-03 19:47:46'),
(3, 'Tecnico Uno', 'tecnico1@sena.edu.co', '$2a$10$JDvPjImPlZIYTImgbj6HMOHxOoE8Ag1/K.9aTgFxk4GYtwCOTrY6y', 1, 'Redes y conectividad', 1, '2026-08-03 19:38:58', '2026-08-03 19:38:58'),
(4, 'Tecnico Dos', 'tecnico2@sena.edu.co', '$2a$10$Q6ApJETouS3k/R6XC/tPg.l047HhvazDH08MisazTwWhBnJ2WGfzO', 1, 'Equipos de computo', 1, '2026-08-03 19:38:58', '2026-08-03 19:51:41');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_casos_completos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_casos_completos` (
`id` int(10) unsigned
,`numero_caso` varchar(30)
,`estado` enum('abierto','asignado','en_proceso','resuelto','cerrado','reabierto')
,`prioridad` enum('baja','media','alta')
,`descripcion` text
,`reportado_por` varchar(150)
,`fecha_creacion` timestamp
,`fecha_asignacion` datetime
,`fecha_resolucion` datetime
,`fecha_cierre` datetime
,`veces_reabierto` smallint(5) unsigned
,`espacio` varchar(100)
,`tipo_espacio` enum('aula','laboratorio','auditorio','oficina','zona_comun','otro')
,`sede` varchar(100)
,`categoria` varchar(60)
,`tecnico_id` int(10) unsigned
,`tecnico_asignado` varchar(100)
,`tecnico_email` varchar(150)
,`minutos_hasta_asignacion` bigint(21)
,`minutos_hasta_resolucion` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_espacios_estadisticas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_espacios_estadisticas` (
`id` int(10) unsigned
,`nombre` varchar(100)
,`tipo` enum('aula','laboratorio','auditorio','oficina','zona_comun','otro')
,`sede` varchar(100)
,`estado` enum('activo','inactivo')
,`total_casos` bigint(21)
,`casos_activos` decimal(23,0)
,`casos_resueltos` decimal(23,0)
,`casos_reabiertos` decimal(23,0)
,`ultimo_caso` timestamp
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_casos_completos`
--
DROP TABLE IF EXISTS `vista_casos_completos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_casos_completos`  AS SELECT `c`.`id` AS `id`, `c`.`numero_caso` AS `numero_caso`, `c`.`estado` AS `estado`, `c`.`prioridad` AS `prioridad`, `c`.`descripcion` AS `descripcion`, `c`.`reportado_por` AS `reportado_por`, `c`.`created_at` AS `fecha_creacion`, `c`.`fecha_asignacion` AS `fecha_asignacion`, `c`.`fecha_resolucion` AS `fecha_resolucion`, `c`.`fecha_cierre` AS `fecha_cierre`, `c`.`veces_reabierto` AS `veces_reabierto`, `e`.`nombre` AS `espacio`, `e`.`tipo` AS `tipo_espacio`, `e`.`sede` AS `sede`, `cat`.`nombre` AS `categoria`, `u`.`id` AS `tecnico_id`, `u`.`nombre` AS `tecnico_asignado`, `u`.`email` AS `tecnico_email`, timestampdiff(MINUTE,`c`.`created_at`,`c`.`fecha_asignacion`) AS `minutos_hasta_asignacion`, timestampdiff(MINUTE,`c`.`created_at`,`c`.`fecha_resolucion`) AS `minutos_hasta_resolucion` FROM (((`casos` `c` join `espacios` `e` on(`e`.`id` = `c`.`espacio_id`)) join `categorias` `cat` on(`cat`.`id` = `c`.`categoria_id`)) left join `usuarios` `u` on(`u`.`id` = `c`.`tecnico_id`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_espacios_estadisticas`
--
DROP TABLE IF EXISTS `vista_espacios_estadisticas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_espacios_estadisticas`  AS SELECT `e`.`id` AS `id`, `e`.`nombre` AS `nombre`, `e`.`tipo` AS `tipo`, `e`.`sede` AS `sede`, `e`.`estado` AS `estado`, count(`c`.`id`) AS `total_casos`, sum(`c`.`estado` in ('abierto','asignado','en_proceso')) AS `casos_activos`, sum(`c`.`estado` = 'resuelto') AS `casos_resueltos`, sum(`c`.`veces_reabierto` > 0) AS `casos_reabiertos`, max(`c`.`created_at`) AS `ultimo_caso` FROM (`espacios` `e` left join `casos` `c` on(`c`.`espacio_id` = `e`.`id`)) GROUP BY `e`.`id`, `e`.`nombre`, `e`.`tipo`, `e`.`sede`, `e`.`estado` ORDER BY count(`c`.`id`) DESC ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `casos`
--
ALTER TABLE `casos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_casos_numero_caso` (`numero_caso`),
  ADD KEY `idx_casos_estado` (`estado`),
  ADD KEY `idx_casos_espacio` (`espacio_id`),
  ADD KEY `idx_casos_categoria` (`categoria_id`),
  ADD KEY `idx_casos_tecnico` (`tecnico_id`),
  ADD KEY `idx_casos_created_at` (`created_at`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categorias_nombre` (`nombre`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `espacios`
--
ALTER TABLE `espacios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_espacios_tipo` (`tipo`),
  ADD KEY `idx_espacios_estado` (`estado`),
  ADD KEY `idx_espacios_nombre` (`nombre`);

--
-- Indices de la tabla `historial_casos`
--
ALTER TABLE `historial_casos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_historial_caso` (`caso_id`),
  ADD KEY `idx_historial_usuario` (`usuario_id`),
  ADD KEY `idx_historial_created_at` (`created_at`);

--
-- Indices de la tabla `push_suscripciones`
--
ALTER TABLE `push_suscripciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `push_suscripciones_endpoint` (`endpoint`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_roles_nombre` (`nombre`);

--
-- Indices de la tabla `tokens_acceso`
--
ALTER TABLE `tokens_acceso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tokens_hash` (`token_hash`),
  ADD KEY `idx_tokens_email_tipo` (`email`,`tipo`),
  ADD KEY `idx_tokens_expira` (`expira_at`),
  ADD KEY `fk_tokens_usuario` (`usuario_id`),
  ADD KEY `fk_tokens_rol` (`rol_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuarios_email` (`email`),
  ADD KEY `idx_usuarios_rol` (`rol_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `casos`
--
ALTER TABLE `casos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `espacios`
--
ALTER TABLE `espacios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `historial_casos`
--
ALTER TABLE `historial_casos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de la tabla `push_suscripciones`
--
ALTER TABLE `push_suscripciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tokens_acceso`
--
ALTER TABLE `tokens_acceso`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `casos`
--
ALTER TABLE `casos`
  ADD CONSTRAINT `fk_casos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_casos_tecnico` FOREIGN KEY (`tecnico_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `historial_casos`
--
ALTER TABLE `historial_casos`
  ADD CONSTRAINT `fk_historial_caso` FOREIGN KEY (`caso_id`) REFERENCES `casos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historial_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `push_suscripciones`
--
ALTER TABLE `push_suscripciones`
  ADD CONSTRAINT `push_suscripciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `tokens_acceso`
--
ALTER TABLE `tokens_acceso`
  ADD CONSTRAINT `fk_tokens_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tokens_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
