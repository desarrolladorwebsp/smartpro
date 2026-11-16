UPDATE `Quote` q JOIN `Client` c ON c.id = q.clientId
SET q.updatedAt = q.updatedAt, q.contactSnapshot = JSON_OBJECT(
  'name', TRIM(CONCAT(c.contactFirstName, ' ', c.contactLastName)),
  'email', c.email, 'phone', c.phone, 'rut', c.rut,
  'address', CONCAT_WS(', ', NULLIF(c.address, ''), NULLIF(c.commune, ''), NULLIF(c.city, ''), NULLIF(c.region, '')),
  'legacyCompanyName', c.companyName
) WHERE q.contactSnapshot IS NULL;

UPDATE `Sale` s JOIN `Client` c ON c.id = s.clientId
SET s.updatedAt = s.updatedAt, s.contactSnapshot = JSON_OBJECT(
  'name', TRIM(CONCAT(c.contactFirstName, ' ', c.contactLastName)),
  'email', c.email, 'phone', c.phone, 'rut', c.rut, 'address', c.address,
  'legacyCompanyName', c.companyName
) WHERE s.contactSnapshot IS NULL;
