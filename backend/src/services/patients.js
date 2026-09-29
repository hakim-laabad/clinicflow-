const AppError = require('../utils/AppError');
const repo = require('../repositories/patients');
const audit = require('../repositories/auditLog');

const translate = (err) => {
  if (err.code === '23505') return new AppError(409, 'A patient with this CIN already exists');
  if (err.code === '23503') return new AppError(409, 'Cannot delete a patient who has appointments');
  return err;
};

exports.list = async ({ search, page, limit }) => {
  const { rows, total } = await repo.list({ search, limit, offset: (page - 1) * limit });
  return { rows, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

exports.get = async (id) => {
  const patient = await repo.findById(id);
  if (!patient) throw new AppError(404, 'Patient not found');
  return patient;
};

exports.create = async (data, userId) => {
  try {
    const result = await repo.create(data);
    await audit.log(userId, 'patient.create', 'patient', result.id);
    return result;
  } catch (err) { throw translate(err); }
};

exports.update = async (id, data, userId) => {
  try {
    const patient = await repo.update(id, data);
    if (!patient) throw new AppError(404, 'Patient not found');
    await audit.log(userId, 'patient.update', 'patient', id);
    return patient;
  } catch (err) { throw translate(err); }
};

exports.remove = async (id, userId) => {
  try {
    if (!(await repo.remove(id))) throw new AppError(404, 'Patient not found');
    await audit.log(userId, 'patient.delete', 'patient', id);
  } catch (err) { throw translate(err); }
};
