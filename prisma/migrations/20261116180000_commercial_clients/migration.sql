ALTER TABLE `Business`
  ADD COLUMN `crmStage` ENUM('NEW','CONTACTED','QUOTED','NEGOTIATION') NOT NULL DEFAULT 'NEW',
  ADD COLUMN `status` ENUM('ACTIVO','POTENCIAL','INACTIVO','RECURRENTE') NOT NULL DEFAULT 'POTENCIAL';

UPDATE `Business` b JOIN `Client` c ON c.id = (
  SELECT c2.id FROM `Client` c2 WHERE c2.businessId = b.id
  ORDER BY FIELD(c2.crmStage, 'NEGOTIATION', 'QUOTED', 'CONTACTED', 'NEW'), c2.createdAt, c2.id LIMIT 1
) SET b.crmStage = c.crmStage, b.status = c.status;

ALTER TABLE `Quote`
  ADD COLUMN `businessId` VARCHAR(191) NULL,
  ADD COLUMN `contactSnapshot` JSON NULL,
  ADD INDEX `Quote_businessId_idx` (`businessId`),
  ADD CONSTRAINT `Quote_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Sale`
  ADD COLUMN `businessId` VARCHAR(191) NULL,
  ADD COLUMN `contactSnapshot` JSON NULL,
  ADD INDEX `Sale_businessId_idx` (`businessId`),
  ADD CONSTRAINT `Sale_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE `Quote` q LEFT JOIN `Client` c ON c.id = q.clientId
JOIN `Business` b ON b.id = CASE
  WHEN q.businessRecipient IS NULL THEN c.businessId
  ELSE JSON_UNQUOTE(JSON_EXTRACT(q.businessRecipient, '$.id')) END
SET q.businessId = b.id;

UPDATE `Sale` s LEFT JOIN `Quote` q ON q.id = s.quoteId
LEFT JOIN `Client` c ON c.id = s.clientId
JOIN `Business` b ON b.id = CASE
  WHEN s.businessRecipient IS NOT NULL THEN JSON_UNQUOTE(JSON_EXTRACT(s.businessRecipient, '$.id'))
  WHEN s.quoteId IS NOT NULL THEN q.businessId
  ELSE c.businessId END
SET s.businessId = b.id;
