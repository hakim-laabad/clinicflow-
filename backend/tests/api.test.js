const request = require('supertest');
const app = require('../src/app');
const { migrate } = require('../scripts/migrate');
const { seed } = require('../scripts/seed');
const { pool } = require('../src/config/db');

const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });
const bearer = (t) => ({ Authorization: `Bearer ${t}` });
const at = (hhmm) => `2030-01-15T${hhmm}:00.000Z`;

let admin;
let staff;
let patientA;
let patientB;

const createPatient = (token, cin) =>
  request(app).post('/api/patients').set(bearer(token))
    .send({ fullName: `Patient ${cin}`, cin, phone: '0612345678', birthDate: '1990-01-01' });
const createAppt = (patientId, time, status) =>
  request(app).post('/api/appointments').set(bearer(staff))
    .send({ patientId, appointmentDate: at(time), status, reason: 'Consultation' });

beforeAll(async () => {
  await migrate();
  await seed();
  admin = (await login('admin@clinicflow.test', 'Admin123!')).body.data.token;
  staff = (await login('staff1@clinicflow.test', 'Staff123!')).body.data.token;
});
afterAll(() => pool.end());

describe('Auth', () => {
  it('logs in with valid credentials', async () => {
    const res = await login('admin@clinicflow.test', 'Admin123!');
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.password).toBeUndefined();
  });
  it('rejects invalid login', async () => {
    const res = await login('admin@clinicflow.test', 'wrong');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
  it('protects routes without a valid token', async () => {
    expect((await request(app).get('/api/patients')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(bearer('garbage'))).status).toBe(401);
  });
  it('returns the current user', async () => {
    const res = await request(app).get('/api/auth/me').set(bearer(staff));
    expect(res.body.data.role).toBe('staff');
  });
});

describe('Patients', () => {
  it('creates a patient', async () => {
    const res = await createPatient(staff, 'T000001');
    expect(res.status).toBe(201);
    patientA = res.body.data.id;
  });
  it('rejects duplicate CIN with 409', async () => {
    expect((await createPatient(staff, 'T000001')).status).toBe(409);
  });
  it('validates input', async () => {
    const res = await request(app).post('/api/patients').set(bearer(staff)).send({ fullName: 'X' });
    expect(res.status).toBe(400);
  });
  it('lists with search and pagination meta', async () => {
    const res = await request(app).get('/api/patients?search=t00000&page=1&limit=5').set(bearer(staff));
    expect(res.body.meta).toMatchObject({ total: 1, page: 1, limit: 5 });
  });
  it('restricts DELETE to admin', async () => {
    const tmp = (await createPatient(staff, 'T000002')).body.data.id;
    expect((await request(app).delete(`/api/patients/${tmp}`).set(bearer(staff))).status).toBe(403);
    expect((await request(app).delete(`/api/patients/${tmp}`).set(bearer(admin))).status).toBe(200);
  });
});

describe('Appointments', () => {
  it('creates an appointment', async () => {
    const res = await createAppt(patientA, '10:00', 'confirmed');
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('confirmed');
  });
  it('returns 404 for an unknown patient', async () => {
    const res = await createAppt('11111111-1111-4111-8111-111111111111', '12:00', 'pending');
    expect(res.status).toBe(404);
  });
  it('rejects a confirmed appointment within 30 minutes (409)', async () => {
    const res = await createAppt(patientA, '10:20', 'confirmed');
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/30 minutes/);
    expect((await createAppt(patientA, '09:45', 'confirmed')).status).toBe(409);
  });
  it('allows pending appointments inside the window', async () => {
    expect((await createAppt(patientA, '10:20', 'pending')).status).toBe(201);
  });
  it('allows a confirmed appointment 40 minutes later', async () => {
    expect((await createAppt(patientA, '10:40', 'confirmed')).status).toBe(201);
  });
  it('allows exactly 30 minutes apart', async () => {
    patientB = (await createPatient(staff, 'T000003')).body.data.id;
    expect((await createAppt(patientB, '10:00', 'confirmed')).status).toBe(201);
    expect((await createAppt(patientB, '10:30', 'confirmed')).status).toBe(201);
  });
  it('ignores cancelled appointments in the rule', async () => {
    expect((await createAppt(patientB, '14:00', 'cancelled')).status).toBe(201);
    expect((await createAppt(patientB, '14:10', 'confirmed')).status).toBe(201);
  });
  it('updates status, and enforces the rule on confirmation', async () => {
    const pending = (await createAppt(patientB, '16:00', 'pending')).body.data.id;
    const ok = await request(app).patch(`/api/appointments/${pending}/status`).set(bearer(staff)).send({ status: 'confirmed' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe('confirmed');

    const clash = (await createAppt(patientB, '16:15', 'pending')).body.data.id;
    const res = await request(app).patch(`/api/appointments/${clash}/status`).set(bearer(staff)).send({ status: 'confirmed' });
    expect(res.status).toBe(409);
  });
  it('rejects an invalid status', async () => {
    const res = await request(app).patch('/api/appointments/11111111-1111-4111-8111-111111111111/status')
      .set(bearer(staff)).send({ status: 'done' });
    expect(res.status).toBe(400);
  });
});

describe('Dashboard', () => {
  it('returns real statistics', async () => {
    const res = await request(app).get('/api/dashboard/stats').set(bearer(staff));
    expect(res.status).toBe(200);
    expect(res.body.data.totalPatients).toBeGreaterThanOrEqual(6);
  });
});
