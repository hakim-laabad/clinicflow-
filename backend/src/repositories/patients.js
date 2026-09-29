const { query } = require('../config/db');

const COLS = `id, full_name AS "fullName", cin, phone, birth_date AS "birthDate", address, created_at AS "createdAt"`;
const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

exports.list = async ({ search, limit, offset }) => {
  const params = [];
  let where = 'WHERE deleted_at IS NULL';
  if (search) {
    params.push(`%${escapeLike(search)}%`);
    where = 'WHERE (full_name ILIKE $1 OR cin ILIKE $1) AND deleted_at IS NULL';
  }
  const n = params.length;
  const [rows, count] = await Promise.all([
    query(`SELECT ${COLS} FROM patients ${where} ORDER BY created_at DESC, id LIMIT $${n + 1} OFFSET $${n + 2}`, [...params, limit, offset]),
    query(`SELECT count(*)::int AS total FROM patients ${where}`, params),
  ]);
  return { rows: rows.rows, total: count.rows[0].total };
};

exports.findById = async (id) => (await query(`SELECT ${COLS} FROM patients WHERE id = $1 AND deleted_at IS NULL`, [id])).rows[0];

const values = (p) => [p.fullName, p.cin, p.phone ?? null, p.birthDate ?? null, p.address ?? null];

exports.create = async (p) =>
  (await query(
    `INSERT INTO patients (full_name, cin, phone, birth_date, address) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLS}`,
    values(p)
  )).rows[0];

exports.update = async (id, p) =>
  (await query(
    `UPDATE patients SET full_name = $2, cin = $3, phone = $4, birth_date = $5, address = $6 WHERE id = $1 RETURNING ${COLS}`,
    [id, ...values(p)]
  )).rows[0];

exports.remove = async (id) => (await query('UPDATE patients SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL', [id])).rowCount > 0;
