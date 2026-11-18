CREATE TABLE `CalendarZoomMeeting` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `ownerEmail` VARCHAR(191) NOT NULL,
  `host` VARCHAR(191) NOT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(5) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `duration` INTEGER NOT NULL,
  `clientKey` VARCHAR(191) NULL,
  `contactId` VARCHAR(191) NULL,
  `zoomId` VARCHAR(191) NULL,
  `joinUrl` TEXT NULL,
  UNIQUE INDEX `CalendarZoomMeeting_host_date_time_key` (`host`, `date`, `time`),
  INDEX `CalendarZoomMeeting_ownerEmail_date_idx` (`ownerEmail`, `date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
