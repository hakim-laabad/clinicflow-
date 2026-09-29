CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fast ILIKE '%term%' search
CREATE EXTENSION IF NOT EXISTS btree_gist; -- lets a GiST exclusion constraint compare UUIDs with "="

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL UNIQUE CHECK (email = lower(email)),
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(10)  NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE patients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  VARCHAR(120) NOT NULL,
  cin        VARCHAR(20)  NOT NULL UNIQUE,
  phone      VARCHAR(20),
  birth_date DATE,
  address    VARCHAR(255),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ON DELETE RESTRICT on both FKs: appointment history must never vanish silently,
-- and a user who created appointments cannot be removed (audit trail).
CREATE TABLE appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_date TIMESTAMP NOT NULL,  -- stored as UTC
  status           VARCHAR(10) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  reason           VARCHAR(255) NOT NULL,
  notes            TEXT,
  created_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Race-condition-proof safety net for the 30-minute rule: two CONFIRMED appointments of the
  -- same patient cannot have overlapping [start, start+30min) ranges. Exactly 30 min apart is allowed.
  CONSTRAINT no_confirmed_overlap EXCLUDE USING gist (
    patient_id WITH =,
    tsrange(appointment_date, appointment_date + interval '30 minutes') WITH &&
  ) WHERE (status = 'confirmed')
);

CREATE INDEX idx_patients_full_name_trgm ON patients USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_patients_cin_trgm       ON patients USING gin (cin gin_trgm_ops);
CREATE INDEX idx_patients_created_at     ON patients (created_at DESC);
CREATE INDEX idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX idx_appointments_date       ON appointments (appointment_date);
CREATE INDEX idx_appointments_status     ON appointments (status);
