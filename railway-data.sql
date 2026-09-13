-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: zettabyte_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'Jose','andres-jose1998@hotmail.com','$2b$12$FRg.50SgnwhcaS3.eAauwOID0rm4F3Dw58uZiqZJp13UX7d4O3SZO','ADMIN','2026-09-12 22:20:02.431','2026-09-12 22:20:02.431');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'computador','2026-09-12 23:00:00.769','2026-09-12 23:00:00.769'),(2,'Computadores','2026-09-12 23:12:25.568','2026-09-12 23:12:25.568'),(3,'Accesorios','2026-09-13 21:12:50.414','2026-09-13 21:12:50.414');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (2,'asus','Windows 11 Home\nEl Zenbook DUO más compacto de la historia, con un nuevo diseño de bisagra oculta y una vista de casi 20\" de amplitud.\nPerfecto para que el multitasking en móvil disfrute de una visualización profesional: Dos OLED ASUS Lumina Pro 3K 144 Hz de 14\" y pantalla táctil de 1000 nits. Claridad antirreflejo al aire libre.\nUn estudio móvil ligero ofrece un rendimiento máximo hasta Intel® Core™ Ultra X9 Series 3 con aceleración de GPU a nivel discreto, desbloqueando una potencia excepcional para IA, renderizado y juegos en movimiento.\nPortátil de doble pantalla con batería de 18+ horas.\nDesde el chasis de Ceraluminum™ la bisagra, el soporte hasta las pantallas, marcando el estándar de oro en durabilidad para la informática portátil.\nModos versátiles con control intuitivo por gestos inteligentes. Soporte ASUS Pen 3,0',3400000,'/uploads/1789254697157-zgf4wz.jpg',14,1,1,1,2,'2026-09-12 23:12:25.606','2026-09-13 20:53:15.484'),(3,'Mouse','Diseñado para acomodarse perfectamente a la curvatura de la mano de aquéllos que pasan gran parte del día sentados frente al computador. Su forma promueve la operación fluida de los seis botones convenientemente ubicados justo en los puntos donde descansan los dedos. Ofrece una conectividad excepcional a través del adaptador ultra compacto de 2.4 GHz, prácticamente sin interferencias ni retardo al transmitir la señal. Equipado con un sensor de alta definición y velocidad regulable. ¡no encontrarás ningún otro accesorio que se compare con el mouse EverRest!',40000,'/uploads/1789333966823-2bc5rh.jpg',10,1,0,1,3,'2026-09-13 21:12:50.440','2026-09-13 21:12:50.440');
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
INSERT INTO `order` VALUES (1,NULL,NULL,3400000,'CANCELLED','2026-09-13 20:15:07.945','2026-09-13 20:52:16.687'),(2,NULL,NULL,3400000,'CONFIRMED','2026-09-13 20:52:44.446','2026-09-13 20:53:15.495'),(3,'Andres Jose Urbano','3165155249',3400000,'CANCELLED','2026-09-13 20:58:22.427','2026-09-13 20:59:34.846');
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `orderitem`
--

LOCK TABLES `orderitem` WRITE;
/*!40000 ALTER TABLE `orderitem` DISABLE KEYS */;
INSERT INTO `orderitem` VALUES (1,1,2,1,3400000),(2,2,2,1,3400000),(3,3,2,1,3400000);
/*!40000 ALTER TABLE `orderitem` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-13 17:06:11
