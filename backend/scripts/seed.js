const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

// Development-only credentials (documented in README).
const USERS = [
  { email: 'admin@clinicflow.test', password: 'Admin123!', role: 'admin' },
  { email: 'staff1@clinicflow.test', password: 'Staff123!', role: 'staff' },
  { email: 'staff2@clinicflow.test', password: 'Staff123!', role: 'staff' },
];

const PATIENTS = [
  ['Ahmed Alaoui', 'AB123456', '0612345678', '1985-03-12', 'Casablanca'],
  ['Fatima Zahra Bennani', 'BK234567', '0623456789', '1992-07-25', 'Rabat'],
  ['Youssef El Idrissi', 'CD345678', '0634567890', '1978-11-02', 'El Jadida'],
  ['Salma Tazi', 'EF456789', '0645678901', '2001-01-18', 'Marrakech'],
  ['Omar Berrada', 'GH567890', null, '1966-09-30', null],
];

// [patientIndex, dayOffset, hour, minute, status, reason]
// Confirmed appointments of the same patient are always >= 30 min apart.
const APPOINTMENTS = [
  [0, 0, 9, 0, 'confirmed', 'General check-up'],
  [0, 0, 9, 20, 'pending', 'Blood test follow-up'],
  [1, 0, 10, 0, 'confirmed', 'Dental consultation'],
  [2, 0, 11, 30, 'pending', 'Back pain'],
  [3, 0, 14, 0, 'cancelled', 'Vaccination'],
  [3, 0, 14, 15, 'confirmed', 'Vaccination (rescheduled)'],
  [0, 1, 9, 30, 'confirmed', 'Results review'],
  [4, 1, 10, 0, 'pending', 'Blood pressure control'],
  [1, -1, 15, 0, 'confirmed', 'Skin allergy'],
  [2, 2, 16, 0, 'confirmed', 'Physiotherapy'],
];

async function seed() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed in production');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE appointments, patients, users CASCADE');

    const userIds = [];
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      const { rows } = await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
        [u.email, hash, u.role]
      );
      userIds.push(rows[0].id);
    }

    const patientIds = [];
    for (const p of PATIENTS) {
      const { rows } = await client.query(
        'INSERT INTO patients (full_name, cin, phone, birth_date, address) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        p
      );
      patientIds.push(rows[0].id);
    }

    const now = new Date();
    for (const [i, day, h, m, status, reason] of APPOINTMENTS) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day, h, m));
      await client.query(
        `INSERT INTO appointments (patient_id, appointment_date, status, reason, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [patientIds[i], date.toISOString(), status, reason, userIds[1 + (i % 2)]]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .then(() => { console.log('Seed complete'); return pool.end(); })
    .catch((err) => { console.error(err); process.exit(1); });
}
