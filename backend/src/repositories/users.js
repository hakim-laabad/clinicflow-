const { query } = require('../config/db');

const PUBLIC = 'id, email, role, created_at AS "createdAt"';

exports.findByEmail = async (email) =>
  (await query('SELECT id, email, password, role FROM users WHERE email = $1', [email])).rows[0];

exports.findById = async (id) => (await query(`SELECT ${PUBLIC} FROM users WHERE id = $1`, [id])).rows[0];
