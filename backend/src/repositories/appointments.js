const { query } = require('../config/db');

const SELECT = `
  SELECT a.id, a.patient_id AS "patientId", p.full_name AS "patientName",
         a.appointment_date AS "appointmentDate", a.status, a.reason, a.notes,
         a.created_by AS "createdBy", a.created_at AS "createdAt"
  FROM appointments a JOIN patients p ON p.id = a.patient_id`;

exports.findById = async (id) => (await query(`${SELECT} WHERE a.id = $1`, [id])).rows[0];

exports.list = async ({ date, status, patientId, tz }) => {
  const where = [];
  const params = [];
  if (date) {
    params.push(date, tz);
    where.push(
      `a.appointment_date >= ($1::date + make_interval(mins => $2::int))
       AND a.appointment_date < ($1::date + make_interval(mins => $2::int) + interval '1 day')`
    );
  }
  if (status) { params.push(status); where.push(`a.status = $${params.length}`); }
  if (patientId) { params.push(patientId); where.push(`a.patient_id = $${params.length}`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return (await query(`${SELECT} ${clause} ORDER BY a.appointment_date DESC`, params)).rows;
};

exports.create = async ({ patientId, appointmentDate, status, reason, notes }, userId) => {
  const { rows } = await query(
    `INSERT INTO appointments (patient_id, appointment_date, status, reason, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [patientId, appointmentDate, status, reason, notes ?? null, userId]
  );
  return exports.findById(rows[0].id);
};

exports.updateStatus = async (id, status) => {
  await query('UPDATE appointments SET status = $2 WHERE id = $1', [id, status]);
  return exports.findById(id);
};

// A confirmed appointment conflicts when it is strictly less than 30 min away (before or after).
exports.hasConfirmedConflict = async (patientId, date, excludeId = null) =>
  (await query(
    `SELECT 1 FROM appointments
     WHERE patient_id = $1 AND status = 'confirmed'
       AND ($3::uuid IS NULL OR id <> $3::uuid)
       AND appointment_date > $2::timestamp - interval '30 minutes'
       AND appointment_date < $2::timestamp + interval '30 minutes'
     LIMIT 1`,
    [patientId, date, excludeId]
  )).rowCount > 0;
