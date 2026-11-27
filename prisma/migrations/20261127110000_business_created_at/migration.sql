ALTER TABLE `Business` ADD COLUMN `createdAt` DATETIME(3) NULL;

UPDATE `Business` b JOIN (
  SELECT `businessId`, MIN(`createdAt`) AS `firstContactAt`
  FROM `Client`
  WHERE `businessId` IS NOT NULL
  GROUP BY `businessId`
) c ON c.`businessId` = b.`id`
SET b.`createdAt` = c.`firstContactAt`
WHERE b.`createdAt` IS NULL;

ALTER TABLE `Business` ALTER COLUMN `createdAt` SET DEFAULT CURRENT_TIMESTAMP(3);
