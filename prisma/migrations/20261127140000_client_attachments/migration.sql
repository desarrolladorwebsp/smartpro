CREATE TABLE `ClientAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NULL,
    `clientId` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(64) NOT NULL,
    `size` INTEGER UNSIGNED NOT NULL,
    `fingerprint` CHAR(64) NOT NULL,
    `bytes` MEDIUMBLOB NOT NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ClientAttachment_businessId_fingerprint_key` (`businessId`, `fingerprint`),
    UNIQUE INDEX `ClientAttachment_clientId_fingerprint_key` (`clientId`, `fingerprint`),
    INDEX `ClientAttachment_businessId_createdAt_idx` (`businessId`, `createdAt`),
    INDEX `ClientAttachment_clientId_createdAt_idx` (`clientId`, `createdAt`),
    CONSTRAINT `ClientAttachment_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ClientAttachment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
