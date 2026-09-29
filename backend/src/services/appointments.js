const AppError = require('../utils/AppError');
const repo = require('../repositories/appointments');
const patients = require('../repositories/patients');
const audit = require('../repositories/auditLog');

const CONFLICT = 'Patient already has a confirmed appointment within 30 minutes.';

async function assertNoConflict(patientId, date, excludeId) {
  if (await repo.hasConfirmedConflict(patientId, date, excludeId)) throw new AppError(409, CONFLICT);
}

// The DB exclusion constraint is the last line of defence against concurrent requests.
const translate = (err) => (err.code === '23P01' ? new AppError(409, CONFLICT) : err);

exports.list = (filters) => repo.list(filters);

exports.create = async (data, userId) => {
  if (!(await patients.findById(data.patientId))) throw new AppError(404, 'Patient not found');
  try {
    if (data.status === 'confirmed') await assertNoConflict(data.patientId, data.appointmentDate);
    const result = await repo.create(data, userId);
    await audit.log(userId, 'appointment.create', 'appointment', result.id);
    return result;
  } catch (err) { throw translate(err); }
};

exports.updateStatus = async (id, status, userId) => {
  const appointment = await repo.findById(id);
  if (!appointment) throw new AppError(404, 'Appointment not found');
  try {
    if (status === 'confirmed' && appointment.status !== 'confirmed') {
      await assertNoConflict(appointment.patientId, appointment.appointmentDate.toISOString(), id);
    }
    const result = await repo.updateStatus(id, status);
    await audit.log(userId, 'appointment.status_change', 'appointment', id, { from: appointment.status, to: status });
    return result;
  } catch (err) { throw translate(err); }
};
