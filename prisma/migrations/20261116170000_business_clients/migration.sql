CREATE TABLE `Business` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `rut` VARCHAR(16) NOT NULL,
  `address` VARCHAR(191) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Business_rut_key` (`rut`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Client` ADD COLUMN `businessId` VARCHAR(191) NULL,
  ADD INDEX `Client_businessId_idx` (`businessId`),
  ADD CONSTRAINT `Client_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Quote` ADD COLUMN `businessRecipient` JSON NULL;
ALTER TABLE `Sale` ADD COLUMN `businessRecipient` JSON NULL;
