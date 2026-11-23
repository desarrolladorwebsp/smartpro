ALTER TABLE `CalendarReminder` ADD COLUMN IF NOT EXISTS `notificationTargets` JSON NULL;
ALTER TABLE `CalendarZoomMeeting` ADD COLUMN IF NOT EXISTS `notificationTargets` JSON NULL;
