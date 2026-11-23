ALTER TABLE `Business` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `Client` ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE INDEX `Business_deletedAt_idx` ON `Business`(`deletedAt`);
CREATE INDEX `Client_deletedAt_idx` ON `Client`(`deletedAt`);
