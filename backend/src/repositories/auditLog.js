const { query } = require('../config/db');

exports.log = (userId, action, entityType, entityId, details = null) =>
  query(
    'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
    [userId, action, entityType, entityId, details ? JSON.stringify(details) : null]
  );
