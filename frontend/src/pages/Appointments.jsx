import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import { validateAppointment } from '../utils/validators.js';
import { formatDateTime, localInputToISO } from '../utils/format.js';
import Icon from '../components/Icon.jsx';
import { EmptyState, ErrorState, Field, Modal, StatusBadge, TableSkeleton } from '../components/ui.jsx';

const STATUSES = ['pending', 'confirmed', 'cancelled'];
const blank = { patientId: '', appointmentDate: '', status: 'pending', reason: '', notes: '' };

function AppointmentForm({ defaultPatientId, onClose, onSaved }) {
  const toast = useToast();
  const patients = useFetch(() => api.patients.list({ limit: 100 }), []);
  const [form, setForm] = useState({
    ...blank,
    patientId: defaultPatientId || '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = validateAppointment(form);
    setErrors(v);
    setFormError('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await api.appointments.create({
        ...form,
        appointmentDate: localInputToISO(form.appointmentDate),
      });
      toast('Appointment scheduled successfully');
      onSaved();
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Schedule New Appointment" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {formError && <div className="alert" role="alert">{formError}</div>}

        <Field label="Patient *" error={errors.patientId}>
          <select
            value={form.patientId}
            onChange={set('patientId')}
            disabled={patients.loading}
          >
            <option value="">{patients.loading ? 'Loading patients…' : 'Select a patient'}</option>
            {(patients.data?.data || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} &bull; CIN: {p.cin}
              </option>
            ))}
          </select>
        </Field>

        <div className="row">
          <Field label="Date & Time *" error={errors.appointmentDate}>
            <input
              type="datetime-local"
              value={form.appointmentDate}
              onChange={set('appointmentDate')}
            />
          </Field>
          <Field label="Initial Status" error={errors.status}>
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Reason for Visit *" error={errors.reason}>
          <input
            placeholder="e.g. General consultation, Blood test follow-up..."
            value={form.reason}
            onChange={set('reason')}
          />
        </Field>

        <Field label="Doctor's / Clinical Notes" error={errors.notes}>
          <textarea
            rows="3"
            placeholder="Optional pre-visit notes or patient indications..."
            value={form.notes}
            onChange={set('notes')}
          />
        </Field>

        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? 'Scheduling…' : 'Confirm & Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Appointments() {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(null);
  const { data, loading, error, reload } = useFetch(
    () => api.appointments.list({ date, status }),
    [date, status]
  );
  const rows = data?.data || [];

  const changeStatus = async (a, next) => {
    if (a.status === next) return;
    setUpdating(a.id);
    try {
      await api.appointments.setStatus(a.id, next);
      toast(`Status updated to "${next}"`);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="appointments-page animate-page-enter">
      <div className="page-head between animate-fade-1">
        <div>
          <h1>Appointments Calendar</h1>
          <p className="muted">
            {rows.length} appointment{rows.length === 1 ? '' : 's'} scheduled
            {date ? ` for ${date}` : ''}
            {status ? ` (${status})` : ''}
          </p>
        </div>
        <button className="btn primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} /> New Appointment
        </button>
      </div>

      <div className="card animate-fade-2">
        <div className="toolbar">
          <div className="filter-group">
            <span className="filter-label">Filter Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Filter by date"
            />
          </div>

          <div className="filter-group">
            <span className="filter-label">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {(date || status) && (
            <button
              className="btn sm"
              onClick={() => {
                setDate('');
                setStatus('');
              }}
            >
              <Icon name="x" size={13} /> Reset Filters
            </button>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Schedule Date &bull; Time</th>
                  <th>Patient Name</th>
                  <th>Reason</th>
                  <th>Notes</th>
                  <th>Current Status</th>
                  <th className="right">Change Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton cols={6} />
                ) : (
                  rows.map((a, i) => (
                    <tr
                      key={a.id}
                      className={`animate-table-row ${updating === a.id ? 'row-busy' : ''}`}
                      style={{ animationDelay: `${0.02 * (i + 1)}s` }}
                    >
                      <td>
                        <div className="datetime-cell">
                          <Icon name="calendar" size={14} />
                          <strong>{formatDateTime(a.appointmentDate)}</strong>
                        </div>
                      </td>
                      <td>
                        <Link to={`/patients/${a.patientId}`} className="link patient-name">
                          {a.patientName}
                        </Link>
                      </td>
                      <td>
                        <span className="reason-cell">{a.reason}</span>
                      </td>
                      <td>
                        <span className="notes-cell" title={a.notes || ''}>
                          {a.notes || <span className="muted">&mdash;</span>}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="right">
                        <select
                          className="status-dropdown"
                          value={a.status}
                          disabled={updating === a.id}
                          onChange={(e) => changeStatus(a, e.target.value)}
                          aria-label={`Status for ${a.patientName}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {!loading && rows.length === 0 && (
              <EmptyState
                title="No appointments found"
                hint={
                  date || status
                    ? 'Try clearing the active date or status filters.'
                    : 'Schedule an appointment using the button above.'
                }
              />
            )}
          </div>
        )}
      </div>

      {creating && (
        <AppointmentForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
export { AppointmentForm };
