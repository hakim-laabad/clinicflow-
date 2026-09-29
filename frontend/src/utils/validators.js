const PHONE = /^\+?\d[\d ]{7,14}$/;

export function validatePatient(v) {
  const e = {};
  if (v.fullName.trim().length < 2) e.fullName = 'Full name is required';
  if (v.cin.trim().length < 4) e.cin = 'CIN is required (min. 4 characters)';
  if (v.phone.trim() && !PHONE.test(v.phone.trim())) e.phone = 'Invalid phone number';
  if (v.birthDate && new Date(v.birthDate) > new Date()) e.birthDate = 'Birth date cannot be in the future';
  return e;
}

export function validateAppointment(v) {
  const e = {};
  if (!v.patientId) e.patientId = 'Select a patient';
  if (!v.appointmentDate) e.appointmentDate = 'Date and time are required';
  if (v.reason.trim().length < 2) e.reason = 'Reason is required';
  return e;
}
