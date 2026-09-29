const { z } = require('zod');

const PHONE = /^\+?\d[\d ]{7,14}$/;
const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v);
const optional = (schema) => z.preprocess(emptyToUndefined, schema.optional());

exports.idParam = z.object({ id: z.string().uuid('Invalid id') });

exports.login = z.object({
  email: z.string().trim().toLowerCase().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

exports.patient = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  cin: z.string().trim().min(4, 'CIN is required').max(20).transform((s) => s.toUpperCase()),
  phone: optional(z.string().trim().regex(PHONE, 'Invalid phone number')),
  birthDate: optional(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be YYYY-MM-DD')
      .refine((d) => !Number.isNaN(Date.parse(d)) && new Date(d) <= new Date(), 'Invalid birth date')
  ),
  address: optional(z.string().trim().max(255)),
});

exports.patientList = z.object({
  search: optional(z.string().trim().max(120)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const status = z.enum(['pending', 'confirmed', 'cancelled'], {
  errorMap: () => ({ message: 'Status must be pending, confirmed or cancelled' }),
});

exports.appointment = z.object({
  patientId: z.string().uuid('Valid patientId is required'),
  appointmentDate: z.string()
    .datetime({ offset: true, message: 'Valid appointment date (ISO 8601) is required' })
    .transform((s) => new Date(s).toISOString()),
  status: status.default('pending'),
  reason: z.string().trim().min(2, 'Reason is required').max(255),
  notes: optional(z.string().trim().max(2000)),
});

exports.appointmentStatus = z.object({ status });

// tz = JS getTimezoneOffset() of the client (minutes), used to compute "local day" boundaries.
const tz = z.coerce.number().int().min(-840).max(840).default(0);

exports.appointmentList = z.object({
  date: optional(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')),
  status: optional(status),
  patientId: optional(z.string().uuid()),
  tz,
});

exports.dashboard = z.object({ tz });
