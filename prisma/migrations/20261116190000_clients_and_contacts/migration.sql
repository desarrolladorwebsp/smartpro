ALTER TABLE `Business`
  MODIFY COLUMN `rut` VARCHAR(16) NULL,
  ADD COLUMN `website` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `notes` TEXT NULL;

CREATE TABLE `Contact` (
  `id` VARCHAR(191) NOT NULL,
  `firstName` VARCHAR(191) NOT NULL,
  `lastName` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL DEFAULT '',
  `jobTitle` VARCHAR(191) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ClientContact` (
  `accountId` VARCHAR(191) NOT NULL,
  `contactId` VARCHAR(191) NOT NULL,
  `legacyClientId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`accountId`, `contactId`),
  UNIQUE INDEX `ClientContact_legacyClientId_key` (`legacyClientId`),
  INDEX `ClientContact_contactId_idx` (`contactId`),
  CONSTRAINT `ClientContact_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Business` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ClientContact_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ClientContact_legacyClientId_fkey` FOREIGN KEY (`legacyClientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Quote` ADD COLUMN `contactId` VARCHAR(191) NULL,
  ADD INDEX `Quote_contactId_idx` (`contactId`),
  ADD CONSTRAINT `Quote_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Sale` ADD COLUMN `contactId` VARCHAR(191) NULL,
  ADD INDEX `Sale_contactId_idx` (`contactId`),
  ADD CONSTRAINT `Sale_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

START TRANSACTION;

INSERT INTO `Business` (`id`, `name`, `rut`, `address`, `website`, `notes`, `crmStage`, `status`)
SELECT CONCAT('cliente-', c.id),
  COALESCE(NULLIF(TRIM(CONCAT(c.contactFirstName, ' ', c.contactLastName)), ''), NULLIF(c.companyName, ''), 'Cliente sin nombre'),
  CASE WHEN CHAR_LENGTH(c.rut) <= 16 AND c.rut <> '' AND NOT EXISTS (SELECT 1 FROM `Business` b WHERE b.rut = c.rut)
    AND NOT EXISTS (SELECT 1 FROM `Client` other WHERE other.businessId IS NULL AND other.rut = c.rut AND other.id < c.id)
    THEN c.rut ELSE NULL END,
  LEFT(CONCAT_WS(', ', NULLIF(c.address, ''), NULLIF(c.commune, ''), NULLIF(c.city, ''), NULLIF(c.region, '')), 191),
  c.website, c.notes, c.crmStage, c.status
FROM `Client` c WHERE c.businessId IS NULL;

INSERT INTO `Contact` (`id`, `firstName`, `lastName`, `phone`, `email`)
SELECT c.id, c.contactFirstName, c.contactLastName, c.phone, c.email FROM `Client` c;

INSERT INTO `ClientContact` (`accountId`, `contactId`, `legacyClientId`)
SELECT COALESCE(c.businessId, CONCAT('cliente-', c.id)), c.id, c.id FROM `Client` c;

UPDATE `Client` c SET c.businessId = CONCAT('cliente-', c.id) WHERE c.businessId IS NULL;

UPDATE `Quote` q JOIN `ClientContact` link ON link.legacyClientId = q.clientId
SET q.contactId = link.contactId,
    q.businessId = COALESCE(q.businessId, CASE WHEN link.accountId = CONCAT('cliente-', q.clientId) THEN link.accountId END);

UPDATE `Sale` s JOIN `ClientContact` link ON link.legacyClientId = s.clientId LEFT JOIN `Quote` q ON q.id = s.quoteId
SET s.contactId = COALESCE(q.contactId, link.contactId),
    s.businessId = COALESCE(s.businessId, q.businessId, CASE WHEN link.accountId = CONCAT('cliente-', s.clientId) THEN link.accountId END);

COMMIT;
