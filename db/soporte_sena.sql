-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: soporte_sena
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `casos`
--

DROP TABLE IF EXISTS `casos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `casos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `numero_caso` varchar(30) DEFAULT NULL COMMENT 'Ej: CASO-2026-0034, se completa despues del insert',
  `espacio_id` int(11) DEFAULT NULL,
  `ubicacion_personalizada` varchar(255) DEFAULT NULL,
  `categoria_id` int(10) unsigned NOT NULL,
  `reportado_por` varchar(150) NOT NULL COMMENT 'Nombre libre, sin FK a usuarios',
  `descripcion` text NOT NULL,
  `foto_novedad` text DEFAULT NULL,
  `estado` enum('abierto','asignado','en_proceso','resuelto','cerrado','reabierto') NOT NULL DEFAULT 'abierto',
  `prioridad` enum('baja','media','alta') NOT NULL DEFAULT 'media',
  `tecnico_id` int(10) unsigned DEFAULT NULL,
  `foto_evidencia` text DEFAULT NULL,
  `notas_resolucion` text DEFAULT NULL,
  `fecha_asignacion` datetime DEFAULT NULL,
  `fecha_resolucion` datetime DEFAULT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `veces_reabierto` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_casos_numero_caso` (`numero_caso`),
  KEY `idx_casos_estado` (`estado`),
  KEY `idx_casos_espacio` (`espacio_id`),
  KEY `idx_casos_categoria` (`categoria_id`),
  KEY `idx_casos_tecnico` (`tecnico_id`),
  KEY `idx_casos_created_at` (`created_at`),
  CONSTRAINT `fk_casos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_casos_tecnico` FOREIGN KEY (`tecnico_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_casos_fecha_asignacion` CHECK (`fecha_asignacion` is null or `fecha_asignacion` >= `created_at`),
  CONSTRAINT `chk_casos_fecha_resolucion` CHECK (`fecha_resolucion` is null or `fecha_resolucion` >= `created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Casos de soporte tecnico reportados';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `casos`
--

LOCK TABLES `casos` WRITE;
/*!40000 ALTER TABLE `casos` DISABLE KEYS */;
INSERT INTO `casos` VALUES (1,'CASO-2026-0001',1,NULL,5,'martina mendez','no hay sonido en el auditorio C','[\"1.jfif\"]','resuelto','media',2,'[\"2.jfif\"]','','2026-07-31 16:29:46','2026-07-31 16:33:42',NULL,0,'2026-07-31 16:28:12','2026-08-03 20:52:19'),(2,'CASO-2026-0002',NULL,'pasillo 3n piso',7,'juan perez','televisor pasillo','[\"2.jfif\"]','resuelto','baja',2,'[\"3.jfif\"]','gdfgdegfr','2026-07-31 18:58:29','2026-07-31 19:15:49',NULL,0,'2026-07-31 18:56:59','2026-08-03 20:52:20'),(3,'CASO-2026-0003',1,NULL,2,'martha mora','no tengo internet','[\"3.jfif\"]','resuelto','alta',2,'[\"1785793830346-267370071.jpg\"]','Equipo conectado a la red','2026-08-03 15:34:55','2026-08-03 21:50:30',NULL,0,'2026-07-31 19:19:01','2026-08-03 21:50:30'),(4,'CASO-2026-0004',2,NULL,5,'Daniel garcia','poner un tv en la cancha de futbol','[\"1.jfif\",\"2.jfif\"]','en_proceso','media',2,'[\"3.jfif\"]',NULL,'2026-08-03 16:11:12',NULL,NULL,0,'2026-08-03 16:09:23','2026-08-03 21:52:55'),(5,'CASO-2026-0005',2,NULL,1,'Tester','Test case multi foto','[\"2.jfif\",\"3.jfif\"]','resuelto','alta',2,'[\"1785795488114-52364037.jpg\"]','Equipo conectado a la red','2026-08-03 22:16:16','2026-08-03 22:18:08',NULL,0,'2026-08-03 16:39:21','2026-08-03 22:18:08'),(6,'CASO-2026-0006',2,NULL,1,'Tester','Test case with 3 fotos','[\"1.jfif\",\"2.jfif\",\"3.jfif\"]','resuelto','alta',3,'[\"1785793829569-161441950.png\"]','prueba con campo notas_resolucion final','2026-08-03 19:40:57','2026-08-03 21:50:29',NULL,0,'2026-08-03 16:45:55','2026-08-03 21:50:29'),(7,'CASO-2026-0007',NULL,'Prueba automatica',5,'Prueba Local IA','Caso de prueba creado por el flujo de verificacion del deep-link push.',NULL,'en_proceso','media',2,NULL,NULL,'2026-08-10 15:47:27',NULL,NULL,0,'2026-08-06 17:43:46','2026-08-10 15:47:28');
/*!40000 ALTER TABLE `casos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  `prioridad_sugerida` enum('baja','media','alta') NOT NULL DEFAULT 'media',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categorias_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Categorias de novedad con prioridad sugerida';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Eléctrico','alta','2026-07-31 12:19:57','2026-07-31 12:19:57'),(2,'Conectividad / Red','alta','2026-07-31 12:19:57','2026-07-31 12:19:57'),(3,'Equipos de cómputo','media','2026-07-31 12:19:57','2026-07-31 12:19:57'),(4,'Mobiliario','baja','2026-07-31 12:19:57','2026-07-31 12:19:57'),(5,'Audiovisuales','media','2026-07-31 12:19:57','2026-07-31 12:19:57'),(6,'Climatización','media','2026-07-31 12:19:57','2026-07-31 12:19:57'),(7,'Otro','baja','2026-07-31 12:19:57','2026-07-31 12:19:57');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracion` (
  `id` tinyint(4) NOT NULL,
  `notificar_nuevo_caso` tinyint(1) NOT NULL DEFAULT 1,
  `notificar_asignacion` tinyint(1) NOT NULL DEFAULT 1,
  `notificar_resolucion` tinyint(1) NOT NULL DEFAULT 0,
  `notificar_email` tinyint(1) NOT NULL DEFAULT 1,
  `asignacion_automatica` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_configuracion_id` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion`
--

LOCK TABLES `configuracion` WRITE;
/*!40000 ALTER TABLE `configuracion` DISABLE KEYS */;
INSERT INTO `configuracion` VALUES (1,1,1,0,0,0,'2026-08-03 20:38:41');
/*!40000 ALTER TABLE `configuracion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `espacios`
--

DROP TABLE IF EXISTS `espacios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `espacios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) DEFAULT NULL COMMENT 'Codigo interno opcional, ej: A-101',
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre visible, ej: Auditorio Principal',
  `tipo` enum('aula','laboratorio','auditorio','oficina','zona_comun','otro') NOT NULL DEFAULT 'aula',
  `sede` varchar(100) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_espacios_tipo` (`tipo`),
  KEY `idx_espacios_estado` (`estado`),
  KEY `idx_espacios_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Aulas, laboratorios, auditorios y demas espacios del campus';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `espacios`
--

LOCK TABLES `espacios` WRITE;
/*!40000 ALTER TABLE `espacios` DISABLE KEYS */;
INSERT INTO `espacios` VALUES (1,NULL,'Ambiente304','aula','Principal','activo','2026-07-31 12:44:36','2026-07-31 12:44:36'),(2,NULL,'ambiente301','aula','Principal','activo','2026-07-31 19:02:30','2026-07-31 19:02:30');
/*!40000 ALTER TABLE `espacios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_casos`
--

DROP TABLE IF EXISTS `historial_casos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historial_casos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `caso_id` int(10) unsigned NOT NULL,
  `accion` enum('creado','asignado','en_proceso','nota','resuelto','cerrado','reabierto','reasignado') NOT NULL,
  `usuario_id` int(10) unsigned DEFAULT NULL COMMENT 'NULL cuando la accion la origina quien reporta, sin cuenta',
  `detalle` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_historial_caso` (`caso_id`),
  KEY `idx_historial_usuario` (`usuario_id`),
  KEY `idx_historial_created_at` (`created_at`),
  CONSTRAINT `fk_historial_caso` FOREIGN KEY (`caso_id`) REFERENCES `casos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_historial_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bitacora de auditoria de cada caso';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_casos`
--

LOCK TABLES `historial_casos` WRITE;
/*!40000 ALTER TABLE `historial_casos` DISABLE KEYS */;
INSERT INTO `historial_casos` VALUES (1,1,'creado',NULL,'Reportado por martina mendez','2026-07-31 16:28:12'),(2,1,'asignado',2,NULL,'2026-07-31 16:29:46'),(3,1,'en_proceso',2,NULL,'2026-07-31 16:30:19'),(4,1,'nota',2,'se revisa consola y conexión, se realizan ajustes y queda todo funcionando','2026-07-31 16:33:38'),(5,1,'resuelto',2,'','2026-07-31 16:33:42'),(6,2,'creado',NULL,'Reportado por juan perez','2026-07-31 18:56:59'),(7,2,'asignado',2,'Tomado por migue perez','2026-07-31 18:58:29'),(8,2,'en_proceso',2,'Trabajo iniciado por migue perez','2026-07-31 18:58:33'),(9,2,'nota',2,'ljhcdwejcbfidbg','2026-07-31 18:59:25'),(10,2,'resuelto',2,'gdfgdegfr','2026-07-31 19:15:49'),(11,3,'creado',NULL,'Reportado por martha mora','2026-07-31 19:19:01'),(12,3,'asignado',1,'Asignado manualmente por el administrador a migue perez','2026-08-03 15:03:02'),(13,3,'asignado',1,'Asignado manualmente por el administrador a migue perez','2026-08-03 15:34:55'),(14,4,'creado',NULL,'Reportado por Daniel garcia','2026-08-03 16:09:23'),(15,4,'asignado',1,'Asignado manualmente por el administrador a migue perez','2026-08-03 16:11:12'),(16,5,'creado',NULL,'Reportado por Tester','2026-08-03 16:39:21'),(17,6,'creado',NULL,'Reportado por Tester','2026-08-03 16:45:55'),(18,6,'asignado',3,NULL,'2026-08-03 19:40:57'),(19,3,'en_proceso',2,NULL,'2026-08-03 21:42:04'),(20,3,'nota',2,'Equipo conectado a la red','2026-08-03 21:47:05'),(21,6,'resuelto',1,'prueba con campo notas_resolucion final','2026-08-03 21:50:29'),(22,3,'resuelto',2,'Equipo conectado a la red','2026-08-03 21:50:30'),(23,4,'en_proceso',2,NULL,'2026-08-03 21:52:55'),(24,5,'asignado',2,NULL,'2026-08-03 22:16:16'),(25,5,'en_proceso',2,NULL,'2026-08-03 22:16:22'),(26,5,'resuelto',2,'Equipo conectado a la red','2026-08-03 22:18:08'),(27,7,'creado',NULL,'Reportado por Prueba Local IA','2026-08-06 17:43:46'),(43,7,'asignado',2,NULL,'2026-08-10 15:47:27'),(44,7,'en_proceso',2,NULL,'2026-08-10 15:47:28');
/*!40000 ALTER TABLE `historial_casos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horarios`
--

DROP TABLE IF EXISTS `horarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `horarios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fijo_sabado` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catalogo de turnos del panel de horarios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horarios`
--

LOCK TABLES `horarios` WRITE;
/*!40000 ALTER TABLE `horarios` DISABLE KEYS */;
INSERT INTO `horarios` VALUES (1,'6-2','06:00:00','14:00:00',1,0,'2026-08-18 15:54:02','2026-08-18 15:54:02'),(2,'7-4','07:00:00','16:00:00',1,0,'2026-08-18 15:54:02','2026-08-18 15:54:02'),(3,'8-5','08:00:00','17:00:00',1,0,'2026-08-18 15:54:02','2026-08-18 15:54:02'),(4,'8-4','08:00:00','16:00:00',1,1,'2026-08-18 15:54:02','2026-08-18 15:54:02'),(5,'2-9','14:00:00','21:00:00',1,0,'2026-08-18 15:54:02','2026-08-18 15:54:02');
/*!40000 ALTER TABLE `horarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horarios_tecnicos`
--

DROP TABLE IF EXISTS `horarios_tecnicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `horarios_tecnicos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tecnico_id` int(10) unsigned NOT NULL,
  `dia_semana` tinyint(1) NOT NULL COMMENT '1=Lunes ... 7=Domingo',
  `horario_id` int(10) unsigned DEFAULT NULL,
  `descanso` tinyint(1) NOT NULL DEFAULT 0,
  `semana` date NOT NULL COMMENT 'Lunes de la semana laboral',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tecnico_dia_semana` (`tecnico_id`,`dia_semana`,`semana`),
  KEY `idx_ht_horario` (`horario_id`),
  CONSTRAINT `fk_ht_horario` FOREIGN KEY (`horario_id`) REFERENCES `horarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ht_tecnico` FOREIGN KEY (`tecnico_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Grilla semanal de horarios por tecnico';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horarios_tecnicos`
--

LOCK TABLES `horarios_tecnicos` WRITE;
/*!40000 ALTER TABLE `horarios_tecnicos` DISABLE KEYS */;
/*!40000 ALTER TABLE `horarios_tecnicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `push_suscripciones`
--

DROP TABLE IF EXISTS `push_suscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `push_suscripciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `push_suscripciones_endpoint` (`endpoint`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `push_suscripciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `push_suscripciones`
--

LOCK TABLES `push_suscripciones` WRITE;
/*!40000 ALTER TABLE `push_suscripciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `push_suscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Roles de usuario del sistema';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'tecnico','Atiende, toma y resuelve casos de soporte tecnico','2026-07-31 12:19:57','2026-07-31 12:19:57'),(2,'administrador','Gestiona espacios, tecnicos, categorias y reportes','2026-07-31 12:19:57','2026-07-31 12:19:57');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokens_acceso`
--

DROP TABLE IF EXISTS `tokens_acceso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tokens_acceso` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tipo` enum('invitacion','restablecimiento') NOT NULL,
  `email` varchar(150) NOT NULL,
  `token_hash` char(64) NOT NULL COMMENT 'SHA-256 hex del token enviado por correo',
  `usuario_id` int(10) unsigned DEFAULT NULL,
  `rol_id` int(10) unsigned DEFAULT NULL COMMENT 'Solo invitacion: rol propuesto para la cuenta nueva',
  `nombre_invitado` varchar(100) DEFAULT NULL COMMENT 'Solo invitacion: nombre propuesto para la cuenta nueva',
  `usado_at` datetime DEFAULT NULL,
  `expira_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tokens_hash` (`token_hash`),
  KEY `idx_tokens_email_tipo` (`email`,`tipo`),
  KEY `idx_tokens_expira` (`expira_at`),
  KEY `fk_tokens_usuario` (`usuario_id`),
  KEY `fk_tokens_rol` (`rol_id`),
  CONSTRAINT `fk_tokens_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_tokens_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invitaciones de cuenta y restablecimiento de contrasena, de un solo uso';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokens_acceso`
--

LOCK TABLES `tokens_acceso` WRITE;
/*!40000 ALTER TABLE `tokens_acceso` DISABLE KEYS */;
INSERT INTO `tokens_acceso` VALUES (1,'invitacion','soportesena31@gmail.com','2910d214bfa92af8c2dc4d8c8246458b4d4ce70ccc7ef865f0347c8e7495efa1',2,1,'migue perez','2026-07-31 14:03:16','2026-08-02 14:01:41','2026-07-31 14:01:41'),(2,'restablecimiento','soportesena31@gmail.com','35daf64fa1dd655e02dacaf8982ea22c59e3f1b0ede55853be0687643fe4dca8',2,NULL,NULL,NULL,'2026-07-31 17:37:37','2026-07-31 16:37:37');
/*!40000 ALTER TABLE `tokens_acceso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'Hash bcrypt, nunca texto plano',
  `rol_id` int(10) unsigned NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL COMMENT 'Ej: electrico, redes - uso futuro para enrutar casos',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  KEY `idx_usuarios_rol` (`rol_id`),
  CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tecnicos y administrador del sistema';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','admin@sena.edu.co','$2a$10$rwfDLIgyWMikNVFfSrlVAO6wEhhJ2tWQRWIFD5pG2XnhRj.orreoG',2,NULL,1,'2026-07-31 12:34:13','2026-08-18 16:17:20'),(2,'miguel perez','soportesena31@gmail.com','$2a$10$hXqJE.nqHQh14sh.vVc71.lS3g1G715bWbKYmwaYrH9/nJiR5Xz5y',1,NULL,1,'2026-07-31 14:03:16','2026-08-03 19:47:46'),(3,'Tecnico Uno','tecnico1@sena.edu.co','$2a$10$JDvPjImPlZIYTImgbj6HMOHxOoE8Ag1/K.9aTgFxk4GYtwCOTrY6y',1,'Redes y conectividad',1,'2026-08-03 19:38:58','2026-08-03 19:38:58'),(4,'Tecnico Dos','tecnico2@sena.edu.co','$2a$10$Q6ApJETouS3k/R6XC/tPg.l047HhvazDH08MisazTwWhBnJ2WGfzO',1,'Equipos de computo',1,'2026-08-03 19:38:58','2026-08-03 19:51:41');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `vista_casos_completos`
--

DROP TABLE IF EXISTS `vista_casos_completos`;
/*!50001 DROP VIEW IF EXISTS `vista_casos_completos`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `vista_casos_completos` AS SELECT
 1 AS `id`,
  1 AS `numero_caso`,
  1 AS `estado`,
  1 AS `prioridad`,
  1 AS `descripcion`,
  1 AS `reportado_por`,
  1 AS `fecha_creacion`,
  1 AS `fecha_asignacion`,
  1 AS `fecha_resolucion`,
  1 AS `fecha_cierre`,
  1 AS `veces_reabierto`,
  1 AS `espacio`,
  1 AS `tipo_espacio`,
  1 AS `sede`,
  1 AS `categoria`,
  1 AS `tecnico_id`,
  1 AS `tecnico_asignado`,
  1 AS `tecnico_email`,
  1 AS `minutos_hasta_asignacion`,
  1 AS `minutos_hasta_resolucion` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `vista_espacios_estadisticas`
--

DROP TABLE IF EXISTS `vista_espacios_estadisticas`;
/*!50001 DROP VIEW IF EXISTS `vista_espacios_estadisticas`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `vista_espacios_estadisticas` AS SELECT
 1 AS `id`,
  1 AS `nombre`,
  1 AS `tipo`,
  1 AS `sede`,
  1 AS `estado`,
  1 AS `total_casos`,
  1 AS `casos_activos`,
  1 AS `casos_resueltos`,
  1 AS `casos_reabiertos`,
  1 AS `ultimo_caso` */;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vista_casos_completos`
--

/*!50001 DROP VIEW IF EXISTS `vista_casos_completos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_casos_completos` AS select `c`.`id` AS `id`,`c`.`numero_caso` AS `numero_caso`,`c`.`estado` AS `estado`,`c`.`prioridad` AS `prioridad`,`c`.`descripcion` AS `descripcion`,`c`.`reportado_por` AS `reportado_por`,`c`.`created_at` AS `fecha_creacion`,`c`.`fecha_asignacion` AS `fecha_asignacion`,`c`.`fecha_resolucion` AS `fecha_resolucion`,`c`.`fecha_cierre` AS `fecha_cierre`,`c`.`veces_reabierto` AS `veces_reabierto`,`e`.`nombre` AS `espacio`,`e`.`tipo` AS `tipo_espacio`,`e`.`sede` AS `sede`,`cat`.`nombre` AS `categoria`,`u`.`id` AS `tecnico_id`,`u`.`nombre` AS `tecnico_asignado`,`u`.`email` AS `tecnico_email`,timestampdiff(MINUTE,`c`.`created_at`,`c`.`fecha_asignacion`) AS `minutos_hasta_asignacion`,timestampdiff(MINUTE,`c`.`created_at`,`c`.`fecha_resolucion`) AS `minutos_hasta_resolucion` from (((`casos` `c` join `espacios` `e` on(`e`.`id` = `c`.`espacio_id`)) join `categorias` `cat` on(`cat`.`id` = `c`.`categoria_id`)) left join `usuarios` `u` on(`u`.`id` = `c`.`tecnico_id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_espacios_estadisticas`
--

/*!50001 DROP VIEW IF EXISTS `vista_espacios_estadisticas`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_espacios_estadisticas` AS select `e`.`id` AS `id`,`e`.`nombre` AS `nombre`,`e`.`tipo` AS `tipo`,`e`.`sede` AS `sede`,`e`.`estado` AS `estado`,count(`c`.`id`) AS `total_casos`,sum(`c`.`estado` in ('abierto','asignado','en_proceso')) AS `casos_activos`,sum(`c`.`estado` = 'resuelto') AS `casos_resueltos`,sum(`c`.`veces_reabierto` > 0) AS `casos_reabiertos`,max(`c`.`created_at`) AS `ultimo_caso` from (`espacios` `e` left join `casos` `c` on(`c`.`espacio_id` = `e`.`id`)) group by `e`.`id`,`e`.`nombre`,`e`.`tipo`,`e`.`sede`,`e`.`estado` order by count(`c`.`id`) desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-18 11:18:06
