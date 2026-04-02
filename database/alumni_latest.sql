-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: alumni_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alumni`
--

DROP TABLE IF EXISTS `alumni`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumni` (
  `Alumni_ID` int NOT NULL AUTO_INCREMENT,
  `User_ID` int NOT NULL,
  `Department` varchar(100) DEFAULT NULL,
  `Graduation_Year` int DEFAULT NULL,
  `Batch` varchar(20) DEFAULT NULL,
  `Contact_Info` varchar(300) DEFAULT NULL,
  `Bio` text,
  `Verification_Status` tinyint(1) DEFAULT '0',
  `Status` enum('pending','verified','rejected') DEFAULT 'pending',
  PRIMARY KEY (`Alumni_ID`),
  UNIQUE KEY `User_ID` (`User_ID`),
  CONSTRAINT `alumni_ibfk_1` FOREIGN KEY (`User_ID`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumni`
--

LOCK TABLES `alumni` WRITE;
/*!40000 ALTER TABLE `alumni` DISABLE KEYS */;
INSERT INTO `alumni` VALUES (1,8,'Computer Science and Engineering',2020,'2016-20','+91 1234567896','Hi , I am working now in Google.',1,'verified');
/*!40000 ALTER TABLE `alumni` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `career_history`
--

DROP TABLE IF EXISTS `career_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `career_history` (
  `Career_ID` int NOT NULL AUTO_INCREMENT,
  `Alumni_ID` int NOT NULL,
  `Company_Name` varchar(150) NOT NULL,
  `Job_Role` varchar(150) NOT NULL,
  `Start_Year` int NOT NULL,
  `End_Year` int DEFAULT NULL,
  PRIMARY KEY (`Career_ID`),
  KEY `Alumni_ID` (`Alumni_ID`),
  CONSTRAINT `career_history_ibfk_1` FOREIGN KEY (`Alumni_ID`) REFERENCES `alumni` (`Alumni_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `career_history`
--

LOCK TABLES `career_history` WRITE;
/*!40000 ALTER TABLE `career_history` DISABLE KEYS */;
INSERT INTO `career_history` VALUES (1,1,'RIT KOTTAYAM','PROFESSOR',2021,2025),(2,1,'Google','Tech Lead',2025,NULL);
/*!40000 ALTER TABLE `career_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `Event_ID` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(200) NOT NULL,
  `Description` text,
  `Event_Date` date NOT NULL,
  `Event_Time` varchar(50) DEFAULT NULL,
  `Mode` varchar(100) DEFAULT NULL,
  `Type` enum('Networking','Talk','Workshop','Seminar','Other') DEFAULT 'Other',
  `Created_By` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Event_ID`),
  KEY `Created_By` (`Created_By`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`Created_By`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Talk night','Future','2026-04-01','7 PM','Online','Talk',8,'2026-03-30 08:28:29');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_applications`
--

DROP TABLE IF EXISTS `job_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_applications` (
  `Application_ID` int NOT NULL AUTO_INCREMENT,
  `Job_ID` int NOT NULL,
  `Student_ID` int NOT NULL,
  `Applied_Date` datetime DEFAULT CURRENT_TIMESTAMP,
  `Status` enum('applied','viewed','shortlisted','rejected') DEFAULT 'applied',
  `Resume_Path` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`Application_ID`),
  UNIQUE KEY `unique_application` (`Job_ID`,`Student_ID`),
  KEY `Student_ID` (`Student_ID`),
  CONSTRAINT `job_applications_ibfk_1` FOREIGN KEY (`Job_ID`) REFERENCES `job_postings` (`Job_ID`) ON DELETE CASCADE,
  CONSTRAINT `job_applications_ibfk_2` FOREIGN KEY (`Student_ID`) REFERENCES `student` (`Student_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_applications`
--

LOCK TABLES `job_applications` WRITE;
/*!40000 ALTER TABLE `job_applications` DISABLE KEYS */;
INSERT INTO `job_applications` VALUES (1,1,1,'2026-03-30 13:59:07','shortlisted','1_1774859347445_chpter_37.pdf'),(2,1,2,'2026-03-30 14:19:59','applied','2_1774860599674_chpter_37.pdf');
/*!40000 ALTER TABLE `job_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_postings`
--

DROP TABLE IF EXISTS `job_postings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_postings` (
  `Job_ID` int NOT NULL AUTO_INCREMENT,
  `Alumni_ID` int NOT NULL,
  `Job_Title` varchar(200) NOT NULL,
  `Company_Name` varchar(150) DEFAULT NULL,
  `Description` text,
  `Posting_Date` date DEFAULT (curdate()),
  PRIMARY KEY (`Job_ID`),
  KEY `Alumni_ID` (`Alumni_ID`),
  CONSTRAINT `job_postings_ibfk_1` FOREIGN KEY (`Alumni_ID`) REFERENCES `alumni` (`Alumni_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_postings`
--

LOCK TABLES `job_postings` WRITE;
/*!40000 ALTER TABLE `job_postings` DISABLE KEYS */;
INSERT INTO `job_postings` VALUES (1,1,'Team','IBM','Leader','2026-03-30');
/*!40000 ALTER TABLE `job_postings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `Notification_ID` int NOT NULL AUTO_INCREMENT,
  `User_ID` int NOT NULL,
  `Title` varchar(200) NOT NULL,
  `Message` text NOT NULL,
  `Type` enum('query','reply','application','verification','job','event') DEFAULT 'query',
  `Is_Read` tinyint(1) DEFAULT '0',
  `Link` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Notification_ID`),
  KEY `User_ID` (`User_ID`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`User_ID`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,7,'New message from Raji R','hi','reply',1,'/chat/1','2026-03-30 12:08:50'),(2,7,'New message from Raji R','Helo','reply',1,'/chat/1','2026-03-30 13:57:10'),(4,7,'Application Status Update','Your application for \"Team\" has been viewed.','application',1,'/my-applications','2026-03-30 13:59:24'),(5,7,'Application Status Update','Your application for \"Team\" was not selected.','application',1,'/my-applications','2026-03-30 13:59:25'),(6,7,'New message from Raji R','tell','reply',1,'/chat/1','2026-03-30 14:12:36'),(8,7,'Application Status Update','You have been shortlisted for \"Team\"! ?','application',1,'/my-applications','2026-03-30 14:18:39'),(11,7,'New message from Raji R','HI','reply',1,'/chat/1','2026-04-02 02:28:50'),(12,7,'New message from Raji R','hi','reply',1,'/chat/1','2026-04-02 02:31:59'),(13,8,'New message from Abhishek S A','hii','reply',1,'/chat/1','2026-04-02 02:32:12'),(14,7,'New message from Raji R','hi','reply',1,'/chat/1','2026-04-02 02:34:58'),(15,8,'New message from Abhishek S A','hi','reply',0,'/chat/1','2026-04-02 02:35:11');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `query`
--

DROP TABLE IF EXISTS `query`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `query` (
  `Query_ID` int NOT NULL AUTO_INCREMENT,
  `Student_ID` int NOT NULL,
  `Alumni_ID` int NOT NULL,
  `Content` text NOT NULL,
  `Query_Date` datetime DEFAULT CURRENT_TIMESTAMP,
  `Status` varchar(20) DEFAULT 'pending',
  `isUnread` tinyint(1) DEFAULT '1',
  `Latest_Sender_Role` varchar(20) DEFAULT 'student',
  PRIMARY KEY (`Query_ID`),
  KEY `Student_ID` (`Student_ID`),
  KEY `Alumni_ID` (`Alumni_ID`),
  CONSTRAINT `query_ibfk_1` FOREIGN KEY (`Student_ID`) REFERENCES `student` (`Student_ID`) ON DELETE CASCADE,
  CONSTRAINT `query_ibfk_2` FOREIGN KEY (`Alumni_ID`) REFERENCES `alumni` (`Alumni_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `query`
--

LOCK TABLES `query` WRITE;
/*!40000 ALTER TABLE `query` DISABLE KEYS */;
INSERT INTO `query` VALUES (1,1,1,'Hi\n','2026-03-30 11:53:52','pending',1,'student');
/*!40000 ALTER TABLE `query` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reply`
--

DROP TABLE IF EXISTS `reply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reply` (
  `Reply_ID` int NOT NULL AUTO_INCREMENT,
  `Query_ID` int NOT NULL,
  `User_ID` int NOT NULL,
  `Content` text NOT NULL,
  `Reply_Date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Reply_ID`),
  KEY `Query_ID` (`Query_ID`),
  KEY `User_ID` (`User_ID`),
  CONSTRAINT `reply_ibfk_1` FOREIGN KEY (`Query_ID`) REFERENCES `query` (`Query_ID`) ON DELETE CASCADE,
  CONSTRAINT `reply_ibfk_2` FOREIGN KEY (`User_ID`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reply`
--

LOCK TABLES `reply` WRITE;
/*!40000 ALTER TABLE `reply` DISABLE KEYS */;
INSERT INTO `reply` VALUES (1,1,8,'hi','2026-03-30 12:08:50'),(2,1,7,'Hi\n','2026-03-30 13:56:45'),(3,1,8,'Helo','2026-03-30 13:57:10'),(4,1,8,'tell','2026-03-30 14:12:36'),(5,1,7,'ok','2026-03-30 14:13:08'),(6,1,7,'HI\n','2026-04-01 15:44:30'),(7,1,8,'HILLO','2026-04-01 15:45:07'),(8,1,8,'HI','2026-04-01 15:45:30'),(9,1,7,'hi','2026-04-01 15:48:09'),(10,1,7,'hi','2026-04-01 15:51:55'),(11,1,7,'hi','2026-04-02 02:19:52'),(12,1,7,'hi','2026-04-02 02:22:16'),(13,1,7,'HI','2026-04-02 02:26:29'),(14,1,8,'HI','2026-04-02 02:28:50'),(15,1,7,'hi\n','2026-04-02 02:31:40'),(16,1,8,'hi','2026-04-02 02:31:59'),(17,1,7,'hii','2026-04-02 02:32:12'),(18,1,8,'hi','2026-04-02 02:34:58'),(19,1,7,'hi','2026-04-02 02:35:11');
/*!40000 ALTER TABLE `reply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student` (
  `Student_ID` int NOT NULL AUTO_INCREMENT,
  `User_ID` int NOT NULL,
  `Roll_No` varchar(50) DEFAULT NULL,
  `Department` varchar(100) DEFAULT NULL,
  `Start_Year` int DEFAULT NULL,
  `End_Year` int DEFAULT NULL,
  PRIMARY KEY (`Student_ID`),
  UNIQUE KEY `User_ID` (`User_ID`),
  CONSTRAINT `student_ibfk_1` FOREIGN KEY (`User_ID`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES (1,7,'24BR16372','Computer Science and Engineering',2024,2027),(2,9,'','',NULL,NULL);
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `User_ID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Email` varchar(150) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Role` enum('student','alumni','admin') NOT NULL,
  `Profile_Pic` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `DOB` date DEFAULT NULL,
  `Gender` varchar(20) DEFAULT NULL,
  `LinkedIn` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`User_ID`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (3,'Admin User','admin@college.edu','$2b$10$WQULcZCD0JlHfacBbWv9mOom4IS9qIdrns018nqTtOGvX3FRs.r1.','admin',NULL,'2026-03-19 08:53:04',NULL,NULL,NULL),(7,'Abhishek S A','abhidhd57@gmail.com','$2b$10$BDAF0vLeBM25JjMvzuFn2e8aMyStfQP2PkU1Tdwt7iA8UldVFPGh.','student','user_7_1774851862840.jpeg','2026-03-30 06:19:39','2006-07-12','Male',NULL),(8,'Raji R','rajir123@gmail.com','$2b$10$A6nVnruKPTfVtePqrvrrX.hupC1BnbAAYmVzcMNsK3p7hTezAXp86','alumni',NULL,'2026-03-30 06:22:06','1986-12-30','Female',NULL),(9,'Annu Shaji','annu123@gmail.com','$2b$10$C7Z/mZikrWHOZu8uy6J.D.MwzBnfXSNiE/.JMDzvhHrx2CVfPTC9O','student',NULL,'2026-03-30 08:49:43',NULL,NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-02 20:05:07
