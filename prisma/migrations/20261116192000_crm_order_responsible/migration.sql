ALTER TABLE Business ADD COLUMN crmPosition INT NULL,
  ADD COLUMN responsibleId VARCHAR(191) NULL,
  ADD INDEX Business_responsibleId_idx (responsibleId),
  ADD CONSTRAINT Business_responsibleId_fkey FOREIGN KEY (responsibleId) REFERENCES User(id) ON DELETE SET NULL ON UPDATE CASCADE;
UPDATE Business b JOIN Client c ON c.id = (
  SELECT c2.id FROM Client c2 WHERE c2.businessId = b.id ORDER BY c2.createdAt, c2.id LIMIT 1
) SET b.responsibleId = c.assignedExecutiveId;
