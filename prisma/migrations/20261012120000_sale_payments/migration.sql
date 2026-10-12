CREATE TABLE IF NOT EXISTS `SalePayment` (
  `id` VARCHAR(191) NOT NULL,
  `saleId` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `method` ENUM('simulated', 'transbank', 'mercadopago', 'transfer', 'cash', 'other') NOT NULL,
  `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `receiptPath` VARCHAR(191) NOT NULL DEFAULT '',
  `receiptFileName` VARCHAR(191) NOT NULL DEFAULT '',
  `orderId` VARCHAR(191) NULL,
  `source` ENUM('ORDER_PAID', 'MANUAL', 'EXTERNAL_API') NOT NULL DEFAULT 'MANUAL',
  `createdByEmail` VARCHAR(191) NOT NULL,
  `observation` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `SalePayment_orderId_key` (`orderId`),
  INDEX `SalePayment_saleId_idx` (`saleId`),
  INDEX `SalePayment_paidAt_idx` (`paidAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @has_sale_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SalePayment' AND CONSTRAINT_NAME = 'SalePayment_saleId_fkey'
);
SET @sql := IF(
  @has_sale_fk = 0,
  'ALTER TABLE `SalePayment` ADD CONSTRAINT `SalePayment_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_order_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SalePayment' AND CONSTRAINT_NAME = 'SalePayment_orderId_fkey'
);
SET @sql := IF(
  @has_order_fk = 0,
  'ALTER TABLE `SalePayment` ADD CONSTRAINT `SalePayment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO `SalePayment` (
  `id`,
  `saleId`,
  `amount`,
  `method`,
  `paidAt`,
  `receiptPath`,
  `receiptFileName`,
  `orderId`,
  `source`,
  `createdByEmail`,
  `observation`,
  `createdAt`,
  `updatedAt`
)
SELECT
  CONCAT('bf_', `id`),
  `id`,
  `total`,
  COALESCE(`paymentMethod`, 'other'),
  `soldAt`,
  `receiptPath`,
  `receiptFileName`,
  `orderId`,
  CASE
    WHEN `source` = 'ORDER_PAID' THEN 'ORDER_PAID'
    WHEN `source` = 'EXTERNAL_API' THEN 'EXTERNAL_API'
    ELSE 'MANUAL'
  END,
  `createdByEmail`,
  `observation`,
  `createdAt`,
  `updatedAt`
FROM `Sale`
WHERE NOT EXISTS (
  SELECT 1 FROM `SalePayment` AS `existing` WHERE `existing`.`saleId` = `Sale`.`id`
)
AND (
  `source` IN ('ORDER_PAID', 'EXTERNAL_API')
  OR (`receiptPath` IS NOT NULL AND `receiptPath` <> '')
);
