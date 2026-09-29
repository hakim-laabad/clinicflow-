import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { formatDate, formatDateTime } from '../utils/format.js';
import Icon from '../components/Icon.jsx';
import { EmptyState, ErrorState, StatusBadge, TableSkeleton } from '../components/ui.jsx';
import { AppointmentForm } from './Appointments.jsx';

export default function PatientDetails() {
  const { id } = useParams();
  const [scheduling, setScheduling] = useState(false);
  const patient = useFetch(() => api.patients.get(id), [id]);
  const appts = useFetch(() => api.appointments.list({ patientId: id }), [id]);
  const p = patient.data?.data;
  const rows = appts.data?.data || [];

  if (patient.error) return <ErrorState message={patient.error} onRetry={patient.reload} />;

  const initials = p?.fullName
    ? p.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'P';

  return (
    <div className="patient-details-page animate-page-enter">
      <div className="page-head between animate-fade-1">
        <div>
          <Link to="/patients" className="link back">
            <Icon name="arrowLeft" size={15} /> Back to Patients
          </Link>
          <div className="patient-header-row">
            <div className="patient-avatar-lg">{initials}</div>
            <div>
              <h1>{p ? p.fullName : <span className="skeleton lg inline" />}</h1>
              <p className="muted">
                CIN: <strong>{p?.cin || '...'}</strong> &bull; Patient ID: <small>{id.slice(0, 8)}...</small>
              </p>
            </div>
          </div>
        </div>

        <div>
          <button className="btn primary" onClick={() => setScheduling(true)}>
            <Icon name="plus" size={16} /> Schedule Visit
          </button>
        </div>
      </div>

      <div className="card animate-fade-2">
        <h2>Patient Dossier &amp; Contact Info</h2>
        <dl className="info">
          <div>
            <dt>National ID (CIN)</dt>
            <dd>
              <span className="cin-badge">{p?.cin || <span className="skeleton" />}</span>
            </dd>
          </div>
          <div>
            <dt>Phone Number</dt>
            <dd>
              {p?.phone ? (
                <a href={`tel:${p.phone}`} className="phone-link">
                  {p.phone}
                </a>
              ) : (
                <span className="muted">&mdash;</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Date of Birth</dt>
            <dd>{p ? formatDate(p.birthDate) : <span className="skeleton" />}</dd>
          </div>
          <div>
            <dt>Residential Address</dt>
            <dd>{p?.address || <span className="muted">&mdash;</span>}</dd>
          </div>
          <div>
            <dt>Registered Since</dt>
            <dd>{p?.createdAt ? formatDate(p.createdAt.slice(0, 10)) : <span className="skeleton" />}</dd>
          </div>
          <div>
            <dt>Total Visits Recorded</dt>
            <dd>
              <strong>{rows.length}</strong> visits
            </dd>
          </div>
        </dl>
      </div>

      <div className="card animate-fade-3">
        <div className="card-head-between">
          <h2>Appointment History ({rows.length})</h2>
          <span className="muted">Chronological order (most recent first)</span>
        </div>

        {appts.error ? (
          <ErrorState message={appts.error} onRetry={appts.reload} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date &bull; Time</th>
                  <th>Reason for Consultation</th>
                  <th>Status</th>
                  <th>Clinical Notes</th>
                </tr>
              </thead>
              <tbody>
                {appts.loading ? (
                  <TableSkeleton cols={4} rows={3} />
                ) : (
                  rows.map((a, i) => (
                    <tr
                      key={a.id}
                      className="animate-table-row"
                      style={{ animationDelay: `${0.02 * (i + 1)}s` }}
                    >
                      <td>
                        <div className="datetime-cell">
                          <Icon name="calendar" size={14} />
                          <span>{formatDateTime(a.appointmentDate)}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{a.reason}</strong>
                      </td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>
                        <span className="notes-cell">{a.notes || <span className="muted">&mdash;</span>}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {!appts.loading && rows.length === 0 && (
              <EmptyState
                title="No appointments recorded yet"
                hint="Click 'Schedule Visit' above to book an appointment for this patient."
              />
            )}
          </div>
        )}
      </div>

      {scheduling && (
        <AppointmentForm
          defaultPatientId={id}
          onClose={() => setScheduling(false)}
          onSaved={() => {
            setScheduling(false);
            appts.reload();
          }}
        />
      )}
    </div>
  );
}
