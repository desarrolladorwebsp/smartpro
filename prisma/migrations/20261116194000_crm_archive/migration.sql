ALTER TABLE `Business`
  ADD COLUMN `crmArchiveState` ENUM('LOST','PAUSED') NULL,
  ADD COLUMN `crmReactivateOn` DATE NULL,
  ADD INDEX `Business_crmArchiveState_crmReactivateOn_idx` (`crmArchiveState`, `crmReactivateOn`);

ALTER TABLE `Client`
  ADD COLUMN `crmArchiveState` ENUM('LOST','PAUSED') NULL,
  ADD COLUMN `crmReactivateOn` DATE NULL,
  ADD INDEX `Client_crmArchiveState_crmReactivateOn_idx` (`crmArchiveState`, `crmReactivateOn`);
