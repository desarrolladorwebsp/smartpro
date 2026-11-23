CREATE TABLE `ClientCrmHistory` (
  `id` VARCHAR(191) NOT NULL,
  `accountId` VARCHAR(191) NULL,
  `clientId` VARCHAR(191) NULL,
  `event` VARCHAR(32) NOT NULL,
  `fromState` VARCHAR(32) NOT NULL,
  `toState` VARCHAR(32) NOT NULL,
  `note` TEXT NOT NULL,
  `actorEmail` VARCHAR(191) NOT NULL,
  `reactivateOn` DATE NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ClientCrmHistory_accountId_createdAt_idx` (`accountId`, `createdAt`),
  INDEX `ClientCrmHistory_clientId_createdAt_idx` (`clientId`, `createdAt`),
  CONSTRAINT `ClientCrmHistory_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Business` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ClientCrmHistory_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
