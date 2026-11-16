ALTER TABLE `Sale`
  ADD COLUMN `directRequestKey` CHAR(64) NULL,
  ADD COLUMN `directRequestHash` CHAR(64) NULL,
  ADD UNIQUE INDEX `Sale_directRequestKey_key` (`directRequestKey`);
