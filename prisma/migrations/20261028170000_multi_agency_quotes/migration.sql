CREATE TABLE IF NOT EXISTS `Agency` (
  `id` VARCHAR(64) NOT NULL,
  `brandName` VARCHAR(191) NOT NULL,
  `legalName` VARCHAR(191) NOT NULL DEFAULT '',
  `rut` VARCHAR(32) NOT NULL DEFAULT '',
  `tagline` VARCHAR(191) NOT NULL DEFAULT '',
  `address` VARCHAR(191) NOT NULL DEFAULT '',
  `commune` VARCHAR(191) NOT NULL DEFAULT '',
  `postalCode` VARCHAR(32) NOT NULL DEFAULT '',
  `offices` TEXT NOT NULL,
  `phone` VARCHAR(64) NOT NULL DEFAULT '',
  `contactName` VARCHAR(191) NOT NULL DEFAULT '',
  `email` VARCHAR(191) NOT NULL DEFAULT '',
  `website` VARCHAR(255) NOT NULL DEFAULT '',
  `logoUrl` VARCHAR(500) NOT NULL DEFAULT '',
  `bankAccountHolder` VARCHAR(191) NOT NULL DEFAULT '',
  `bankRut` VARCHAR(32) NOT NULL DEFAULT '',
  `bankName` VARCHAR(100) NOT NULL DEFAULT '',
  `bankAccountType` VARCHAR(100) NOT NULL DEFAULT '',
  `bankAccountNumber` VARCHAR(100) NOT NULL DEFAULT '',
  `bankEmail` VARCHAR(191) NOT NULL DEFAULT '',
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Quote`
  ADD COLUMN `agencyId` VARCHAR(64) NOT NULL DEFAULT 'smartpro',
  ADD COLUMN `agencySnapshot` JSON NULL,
  ADD INDEX `Quote_agencyId_idx` (`agencyId`);

ALTER TABLE `Sale`
  ADD COLUMN `agencyId` VARCHAR(64) NOT NULL DEFAULT 'smartpro',
  ADD COLUMN `agencySnapshot` JSON NULL,
  ADD INDEX `Sale_agencyId_idx` (`agencyId`);

INSERT INTO `Agency` (`id`, `brandName`, `legalName`, `rut`, `tagline`, `address`, `commune`, `postalCode`, `offices`, `phone`, `contactName`, `email`, `website`, `logoUrl`, `bankAccountHolder`, `bankRut`, `bankName`, `bankAccountType`, `bankAccountNumber`, `bankEmail`, `active`) VALUES
('smartpro', 'SmartPro', 'Empresa Comercial LyV SpA', '78.206.607-2', 'Agencia de marketing digital', 'Santa Elena 941B', 'Santiago, Chile', '7500000', 'Santa Elena 941 B, Santiago; Vicuña Mackenna 920, of. 726, Ñuñoa', '+56 9 4977 3707', '', 'contacto@smartpro.cl', 'https://smartpro.cl', '/images/logo/logo-smartpro-full.png', 'Empresa Comercial LyV SpA', '78.206.607-2', 'Banco BCI', 'Cuenta Corriente en pesos', '97610224', 'contacto@smartpro.cl', TRUE),
('smartstudio', 'SmartStudio', 'Vilero Group SpA', '78.411.673-5', '', '', '', '', '', '', '', 'contacto@smartstudio.cl', '', '', 'Vilero Group SpA', '78.411.673-5', 'Bci', 'Cuenta corriente en pesos', '77174361', 'contacto@smartstudio.cl', TRUE)
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);

UPDATE `Quote` SET `agencySnapshot` = JSON_OBJECT(
  'id', 'smartpro', 'brandName', 'SmartPro', 'legalName', 'Empresa Comercial LyV SpA', 'rut', '78.206.607-2',
  'tagline', 'Agencia de marketing digital', 'address', 'Santa Elena 941B', 'commune', 'Santiago, Chile',
  'postalCode', '7500000', 'offices', 'Santa Elena 941 B, Santiago; Vicuña Mackenna 920, of. 726, Ñuñoa',
  'phone', '+56 9 4977 3707', 'contactName', '', 'email', 'contacto@smartpro.cl',
  'website', 'https://smartpro.cl', 'logoUrl', '/images/logo/logo-smartpro-full.png',
  'bankAccountHolder', 'Empresa Comercial LyV SpA', 'bankRut', '78.206.607-2', 'bankName', 'Banco BCI',
  'bankAccountType', 'Cuenta Corriente en pesos', 'bankAccountNumber', '97610224', 'bankEmail', 'contacto@smartpro.cl'
), `updatedAt` = `updatedAt` WHERE `agencySnapshot` IS NULL;

UPDATE `Sale` AS sale
LEFT JOIN `Quote` AS quote ON quote.`id` = sale.`quoteId`
SET sale.`updatedAt` = sale.`updatedAt`,
    sale.`agencyId` = COALESCE(quote.`agencyId`, 'smartpro'),
    sale.`agencySnapshot` = COALESCE(quote.`agencySnapshot`, JSON_OBJECT(
      'id', 'smartpro', 'brandName', 'SmartPro', 'legalName', 'Empresa Comercial LyV SpA', 'rut', '78.206.607-2',
      'tagline', 'Agencia de marketing digital', 'address', 'Santa Elena 941B', 'commune', 'Santiago, Chile',
      'postalCode', '7500000', 'offices', 'Santa Elena 941 B, Santiago; Vicuña Mackenna 920, of. 726, Ñuñoa',
      'phone', '+56 9 4977 3707', 'contactName', '', 'email', 'contacto@smartpro.cl',
      'website', 'https://smartpro.cl', 'logoUrl', '/images/logo/logo-smartpro-full.png',
      'bankAccountHolder', 'Empresa Comercial LyV SpA', 'bankRut', '78.206.607-2', 'bankName', 'Banco BCI',
      'bankAccountType', 'Cuenta Corriente en pesos', 'bankAccountNumber', '97610224', 'bankEmail', 'contacto@smartpro.cl'
    ))
WHERE sale.`agencySnapshot` IS NULL;
