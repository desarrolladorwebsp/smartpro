CREATE TABLE `CalendarReminder` (
  `id` VARCHAR(191) NOT NULL,
  `ownerEmail` VARCHAR(191) NOT NULL,
  `date` DATE NOT NULL,
  `note` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `CalendarReminder_ownerEmail_date_idx` (`ownerEmail`, `date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
