import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { ErrorState, StatusBadge, TableSkeleton } from '../components/ui.jsx';
import { formatDateTime, formatDate } from '../utils/format.js';
import Icon from '../components/Icon.jsx';

const STAT_CARDS = [
  { key: 'totalPatients', label: 'Total Patients', icon: 'users', color: '--primary' },
  { key: 'todayAppointments', label: "Today's Appointments", icon: 'calendar', color: '--primary' },
  { key: 'pending', label: 'Pending Review', icon: 'clock', color: '--pending' },
  { key: 'confirmed', label: 'Confirmed Today', icon: 'check', color: '--confirmed' },
];

export default function Dashboard() {
  const statsFetch = useFetch(() => api.stats(), []);
  const apptsFetch = useFetch(() => api.appointments.list(), []);
  const patientsFetch = useFetch(() => api.patients.list({ limit: 5 }), []);

  const stats = statsFetch.data?.data;
  const recentAppts = (apptsFetch.data?.data || []).slice(0, 5);
  const recentPatients = patientsFetch.data?.data || [];

  return (
    <div className="dashboard-container animate-dashboard-enter">
      <div className="page-head between animate-fade-1">
        <div>
          <h1>Clinic Dashboard</h1>
          <p className="muted">Overview of daily appointments, patient intake, and clinic activity.</p>
        </div>
        <div className="dashboard-quick-actions">
          <Link to="/appointments" className="btn primary">
            <Icon name="plus" size={15} /> Book Appointment
          </Link>
          <Link to="/patients" className="btn">
            <Icon name="users" size={15} /> Add Patient
          </Link>
        </div>
      </div>

      {statsFetch.error ? (
        <ErrorState message={statsFetch.error} onRetry={statsFetch.reload} />
      ) : (
        <>
          {/* Top 4 KPI Metrics */}
          <div className="grid">
            {STAT_CARDS.map((c, i) => (
              <div
                key={c.key}
                className="card stat animate-dashboard-card"
                style={{ animationDelay: `${0.05 * (i + 1)}s` }}
              >
                <div className="stat-top">
                  <span className="muted">{c.label}</span>
                  <span
                    className="tile"
                    style={
                      c.color !== '--primary'
                        ? {
                            background: `var(${c.color}-bg, var(--primary-50))`,
                            color: `var(${c.color}, var(--primary))`
                          }
                        : undefined
                    }
                  >
                    <Icon name={c.icon} size={18} />
                  </span>
                </div>
                {statsFetch.loading ? (
                  <div className="skeleton lg" />
                ) : (
                  <strong>{stats?.[c.key] ?? 0}</strong>
                )}
              </div>
            ))}
          </div>

          {/* 2-Column Clinical Overview Grid */}
          <div className="dashboard-columns animate-fade-2">
            {/* Left Column: Recent Appointments Schedule */}
            <div className="card dashboard-main-card">
              <div className="card-head-between">
                <div>
                  <h2>Upcoming &amp; Recent Appointments</h2>
                  <span className="muted">Latest consultations across all doctors</span>
                </div>
                <Link to="/appointments" className="link">
                  View all ({apptsFetch.data?.data?.length || 0}) &rarr;
                </Link>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time &bull; Date</th>
                      <th>Patient</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apptsFetch.loading ? (
                      <TableSkeleton cols={4} rows={4} />
                    ) : recentAppts.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="table-empty-cell">
                          No appointments scheduled yet. Click &ldquo;Book Appointment&rdquo; to start.
                        </td>
                      </tr>
                    ) : (
                      recentAppts.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div className="datetime-cell">
                              <Icon name="calendar" size={13} />
                              <span>{formatDateTime(a.appointmentDate)}</span>
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
                            <StatusBadge status={a.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Recent Patients & Quick Info */}
            <div className="dashboard-side-col">
              {/* Recent Patients Card */}
              <div className="card">
                <div className="card-head-between">
                  <div>
                    <h2>Recent Patients</h2>
                    <span className="muted">Newly registered dossiers</span>
                  </div>
                  <Link to="/patients" className="link">
                    Directory &rarr;
                  </Link>
                </div>

                <div className="recent-patients-list">
                  {patientsFetch.loading ? (
                    <div className="skeleton-list">
                      <div className="skeleton" style={{ height: '40px', marginBottom: '8px' }} />
                      <div className="skeleton" style={{ height: '40px', marginBottom: '8px' }} />
                      <div className="skeleton" style={{ height: '40px' }} />
                    </div>
                  ) : recentPatients.length === 0 ? (
                    <p className="muted" style={{ padding: '12px 0' }}>
                      No patients registered yet.
                    </p>
                  ) : (
                    recentPatients.map((p) => {
                      const initials = p.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      return (
                        <div key={p.id} className="recent-patient-item">
                          <span className="patient-avatar">{initials}</span>
                          <div className="recent-patient-meta">
                            <Link to={`/patients/${p.id}`} className="link patient-name">
                              {p.fullName}
                            </Link>
                            <span className="muted">CIN: {p.cin}</span>
                          </div>
                          <span className="recent-patient-date muted">
                            {p.birthDate ? formatDate(p.birthDate) : '—'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
