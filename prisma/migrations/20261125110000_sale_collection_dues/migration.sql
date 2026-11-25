CREATE TABLE IF NOT EXISTS `SaleCollectionDue` (
  `id` VARCHAR(191) NOT NULL,
  `saleId` VARCHAR(191) NOT NULL,
  `sequence` INTEGER NOT NULL,
  `dueOn` DATE NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `SaleCollectionDue_saleId_sequence_key` (`saleId`, `sequence`),
  INDEX `SaleCollectionDue_dueOn_idx` (`dueOn`),
  CONSTRAINT `SaleCollectionDue_saleId_fkey` FOREIGN KEY (`saleId`)
    REFERENCES `Sale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
