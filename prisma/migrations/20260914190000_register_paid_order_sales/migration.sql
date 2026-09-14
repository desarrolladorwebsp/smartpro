-- Register paid checkout orders as sales. Works on databases that already have
-- Sale and on those that still need the table.

SET @has_order_quote := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND COLUMN_NAME = 'quoteId'
);
SET @sql := IF(@has_order_quote = 0, 'ALTER TABLE `Order` ADD COLUMN `quoteId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_order_quote_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND INDEX_NAME = 'Order_quoteId_idx'
);
SET @sql := IF(@has_order_quote_idx = 0, 'CREATE INDEX `Order_quoteId_idx` ON `Order`(`quoteId`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `Sale` (
  `id` VARCHAR(191) NOT NULL,
  `number` VARCHAR(191) NOT NULL,
  `status` ENUM('REGISTERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
  `source` ENUM('MANUAL', 'QUOTE_ACCEPTED', 'ORDER_PAID') NOT NULL DEFAULT 'MANUAL',
  `clientId` VARCHAR(191) NOT NULL,
  `quoteId` VARCHAR(191) NULL,
  `orderId` VARCHAR(191) NULL,
  `paymentMethod` ENUM('simulated', 'transbank', 'mercadopago') NULL,
  `executiveId` VARCHAR(191) NULL,
  `createdByEmail` VARCHAR(191) NOT NULL,
  `soldAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `observation` TEXT NOT NULL,
  `receiptPath` VARCHAR(191) NOT NULL DEFAULT '',
  `receiptFileName` VARCHAR(191) NOT NULL DEFAULT '',
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `tax` DECIMAL(12, 2) NOT NULL,
  `total` DECIMAL(12, 2) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Sale_number_key` (`number`),
  UNIQUE INDEX `Sale_quoteId_key` (`quoteId`),
  UNIQUE INDEX `Sale_orderId_key` (`orderId`),
  INDEX `Sale_clientId_idx` (`clientId`),
  INDEX `Sale_executiveId_idx` (`executiveId`),
  INDEX `Sale_status_idx` (`status`),
  INDEX `Sale_soldAt_idx` (`soldAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Sale` MODIFY COLUMN `quoteId` VARCHAR(191) NULL;
ALTER TABLE `Sale` MODIFY COLUMN `source` ENUM('MANUAL', 'QUOTE_ACCEPTED', 'ORDER_PAID') NOT NULL DEFAULT 'MANUAL';

SET @has_order_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Sale' AND COLUMN_NAME = 'orderId'
);
SET @sql := IF(@has_order_id = 0, 'ALTER TABLE `Sale` ADD COLUMN `orderId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_payment_method := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Sale' AND COLUMN_NAME = 'paymentMethod'
);
SET @sql := IF(
  @has_payment_method = 0,
  'ALTER TABLE `Sale` ADD COLUMN `paymentMethod` ENUM(''simulated'', ''transbank'', ''mercadopago'') NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_order_id_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Sale' AND INDEX_NAME = 'Sale_orderId_key'
);
SET @sql := IF(@has_order_id_idx = 0, 'CREATE UNIQUE INDEX `Sale_orderId_key` ON `Sale`(`orderId`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_order_quote_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Order' AND CONSTRAINT_NAME = 'Order_quoteId_fkey'
);
SET @sql := IF(
  @has_order_quote_fk = 0,
  'ALTER TABLE `Order` ADD CONSTRAINT `Order_quoteId_fkey` FOREIGN KEY (`quoteId`) REFERENCES `Quote`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_sale_order_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Sale' AND CONSTRAINT_NAME = 'Sale_orderId_fkey'
);
SET @sql := IF(
  @has_sale_order_fk = 0,
  'ALTER TABLE `Sale` ADD CONSTRAINT `Sale_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_sale_client_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Sale' AND CONSTRAINT_NAME = 'Sale_clientId_fkey'
);
SET @sql := IF(
  @has_sale_client_fk = 0,
  'ALTER TABLE `Sale` ADD CONSTRAINT `Sale_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_sale_quote_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Sale' AND CONSTRAINT_NAME = 'Sale_quoteId_fkey'
);
SET @sql := IF(
  @has_sale_quote_fk = 0,
  'ALTER TABLE `Sale` ADD CONSTRAINT `Sale_quoteId_fkey` FOREIGN KEY (`quoteId`) REFERENCES `Quote`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
