ALTER TABLE `ClientNote` DROP FOREIGN KEY `ClientNote_clientId_fkey`;
ALTER TABLE `ClientNote`
  MODIFY COLUMN `clientId` VARCHAR(191) NULL,
  ADD COLUMN `accountId` VARCHAR(191) NULL,
  ADD INDEX `ClientNote_accountId_createdAt_idx` (`accountId`, `createdAt`),
  ADD CONSTRAINT `ClientNote_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ClientNote_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Business` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
