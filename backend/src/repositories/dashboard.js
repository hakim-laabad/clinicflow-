const { query } = require('../config/db');

exports.stats = async (tz) => {
  const dayStart = `date_trunc('day', (now() AT TIME ZONE 'UTC') - make_interval(mins => $1::int)) + make_interval(mins => $1::int)`;
  const { rows } = await query(
    `SELECT
       (SELECT count(*) FROM patients)::int AS "totalPatients",
       (SELECT count(*) FROM appointments
         WHERE appointment_date >= ${dayStart} AND appointment_date < ${dayStart} + interval '1 day'
           AND status <> 'cancelled')::int AS "todayAppointments",
       (SELECT count(*) FROM appointments WHERE status = 'pending')::int AS pending,
       (SELECT count(*) FROM appointments WHERE status = 'confirmed')::int AS confirmed`,
    [tz]
  );
  return rows[0];
};
