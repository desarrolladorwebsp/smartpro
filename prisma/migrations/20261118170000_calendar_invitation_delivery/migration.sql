ALTER TABLE `CalendarZoomMeeting`
  ADD COLUMN `clientInvitationEmail` VARCHAR(254) NULL,
  ADD COLUMN `clientInvitationStatus` ENUM('PENDING', 'DELIVERED', 'FAILED') NULL,
  ADD COLUMN `clientInvitationResendId` VARCHAR(191) NULL,
  ADD COLUMN `clientInvitationEventAt` DATETIME(3) NULL,
  ADD COLUMN `clientInvitationFailure` VARCHAR(255) NULL,
  ADD UNIQUE INDEX `CalendarZoomMeeting_clientInvitationResendId_key` (`clientInvitationResendId`);
