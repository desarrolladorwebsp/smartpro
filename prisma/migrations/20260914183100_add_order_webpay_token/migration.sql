-- Align Order with prisma/schema.prisma. Additive only: nullable unique token used by Webpay.
-- Safe for existing rows; does not rewrite or drop data.

ALTER TABLE `Order` ADD COLUMN `webpayToken` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Order_webpayToken_key` ON `Order`(`webpayToken`);
