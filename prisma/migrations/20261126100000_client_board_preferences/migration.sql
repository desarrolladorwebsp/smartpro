CREATE TABLE IF NOT EXISTS `ClientBoardPreference` (
  `userId` VARCHAR(191) NOT NULL,
  `display` JSON NULL,
  `collapsed` JSON NULL,
  `cardOrder` JSON NULL,
  PRIMARY KEY (`userId`),
  CONSTRAINT `ClientBoardPreference_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
