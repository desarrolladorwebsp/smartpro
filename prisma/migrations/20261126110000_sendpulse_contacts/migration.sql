CREATE TABLE IF NOT EXISTS `SendpulseContact` (
  `externalId` VARCHAR(128) NOT NULL,
  `clientId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`externalId`),
  INDEX `SendpulseContact_clientId_idx` (`clientId`),
  CONSTRAINT `SendpulseContact_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
