# ClinicFlow API

Base URL: `http://localhost:4000/api` · JSON only · Auth header: `Authorization: Bearer <token>`

Success: `{ "success": true, "data": ... }` (lists add `"meta"`). Error: `{ "success": false, "message": "...", "errors": [{ "field", "message" }] }`.
Common errors on protected routes: **401** missing/invalid/expired token · **400** validation failed · **500** internal error.

## Auth
### POST /api/auth/login — public
Body: `{ "email": "admin@clinicflow.test", "password": "Admin123!" }`
200: `{ "success": true, "data": { "token": "<jwt>", "user": { "id", "email", "role" } } }` · Errors: 400 invalid body, 401 invalid credentials.

### GET /api/auth/me — auth: required · role: admin/staff
200: `{ "success": true, "data": { "id", "email", "role", "createdAt" } }`

## Patients (auth required)
### POST /api/patients — admin/staff
Body: `{ "fullName": "Ahmed Alaoui", "cin": "AB123456", "phone": "0612345678", "birthDate": "1998-05-20", "address": "Casablanca" }` (`phone`, `birthDate`, `address` optional).
201: `{ "success": true, "data": { "id", "fullName", "cin", "phone", "birthDate", "address", "createdAt" } }` · Errors: 400, 409 duplicate CIN.

### GET /api/patients — admin/staff
Query: `search` (name or CIN, partial), `page` (default 1), `limit` (default 10, max 100).
200: `{ "success": true, "data": [patient], "meta": { "total", "page", "limit", "totalPages" } }`

### GET /api/patients/:id — admin/staff
200: patient · Errors: 400 invalid id, 404.

### PUT /api/patients/:id — admin/staff
Body: same as create (full replace). 200: patient · Errors: 400, 404, 409 duplicate CIN.

### DELETE /api/patients/:id — **admin only**
200: `{ "success": true, "message": "Patient deleted" }` · Errors: 403 (staff), 404, 409 patient has appointments.

## Appointments (auth required, admin/staff)
### POST /api/appointments
Body: `{ "patientId": "<uuid>", "appointmentDate": "2030-01-15T10:00:00Z", "status": "pending|confirmed|cancelled" (default pending), "reason": "Check-up", "notes": "optional" }`
201: `{ "data": { "id", "patientId", "patientName", "appointmentDate", "status", "reason", "notes", "createdBy", "createdAt" } }`
Errors: 400, 404 patient not found, **409** `Patient already has a confirmed appointment within 30 minutes.`

### GET /api/appointments
Query: `date` (YYYY-MM-DD), `status`, `patientId` (uuid), `tz` (client `getTimezoneOffset()` minutes, default 0; defines the day boundaries for `date`).
200: `{ "data": [appointment] }` sorted by date, newest first.

### PATCH /api/appointments/:id/status
Body: `{ "status": "confirmed" }` · 200: appointment · Errors: 400, 404, **409** (confirming would break the 30-minute rule).

## Dashboard
### GET /api/dashboard/stats — auth required, admin/staff
Query: `tz` (as above). 200: `{ "data": { "totalPatients", "todayAppointments", "pending", "confirmed" } }` (today excludes cancelled).

## Health
### GET /api/health — public → `{ "success": true, "status": "ok" }`
