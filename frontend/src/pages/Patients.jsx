import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useFetch, useDebounce } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validatePatient } from '../utils/validators.js';
import { formatDate } from '../utils/format.js';
import Icon from '../components/Icon.jsx';
import { ConfirmDialog, EmptyState, ErrorState, Field, Modal, TableSkeleton } from '../components/ui.jsx';

const LIMIT = 10;
const blank = { fullName: '', cin: '', phone: '', birthDate: '', address: '' };

function PatientForm({ patient, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(
    patient ? { ...blank, ...Object.fromEntries(Object.entries(patient).map(([k, v]) => [k, v ?? ''])) } : blank
  );
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = validatePatient(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const body = {
      fullName: form.fullName.trim(),
      cin: form.cin.trim().toUpperCase(),
      phone: form.phone.trim() || undefined,
      birthDate: form.birthDate || undefined,
      address: form.address.trim() || undefined,
    };
    try {
      if (patient) await api.patients.update(patient.id, body);
      else await api.patients.create(body);
      toast(patient ? 'Patient updated successfully' : 'New patient registered successfully');
      onSaved();
    } catch (err) {
      setErrors(
        err.fields && Object.keys(err.fields).length
          ? err.fields
          : { cin: err.status === 409 ? err.message : undefined }
      );
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={patient ? 'Edit Patient Record' : 'Register New Patient'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Full Name *" error={errors.fullName}>
          <input
            placeholder="e.g. Ahmed Alaoui"
            value={form.fullName}
            onChange={set('fullName')}
            autoFocus
          />
        </Field>
        <div className="row">
          <Field label="National ID (CIN) *" error={errors.cin}>
            <input
              placeholder="e.g. AB123456"
              value={form.cin}
              onChange={set('cin')}
              style={{ textTransform: 'uppercase' }}
            />
          </Field>
          <Field label="Phone Number" error={errors.phone}>
            <input
              placeholder="e.g. 0612345678"
              value={form.phone}
              onChange={set('phone')}
            />
          </Field>
        </div>
        <Field label="Date of Birth" error={errors.birthDate}>
          <input type="date" value={form.birthDate} onChange={set('birthDate')} />
        </Field>
        <Field label="Residential Address" error={errors.address}>
          <input
            placeholder="e.g. 14 Bd Zerktouni, Casablanca"
            value={form.address}
            onChange={set('address')}
          />
        </Field>
        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? 'Saving…' : patient ? 'Save Changes' : 'Create Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Patients() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setPage(1), [q]);
  const { data, loading, error, reload } = useFetch(
    () => api.patients.list({ search: q, page, limit: LIMIT }),
    [q, page]
  );
  const rows = data?.data || [];
  const meta = data?.meta;

  const remove = async () => {
    setBusy(true);
    try {
      await api.patients.remove(deleting.id);
      toast('Patient archived (soft-deleted)');
      setDeleting(null);
      reload();
    } catch (err) {
      toast(err.message, 'error');
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="patients-page animate-page-enter">
      <div className="page-head between animate-fade-1">
        <div>
          <h1>Patient Directory</h1>
          <p className="muted">
            {meta ? `${meta.total} registered patient${meta.total === 1 ? '' : 's'}` : 'Manage clinic patient records.'}
          </p>
        </div>
        <button className="btn primary" onClick={() => setEditing({})}>
          <Icon name="plus" size={16} /> Register Patient
        </button>
      </div>

      <div className="card animate-fade-2">
        <div className="toolbar">
          <div className="search">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Search by patient name or CIN (e.g. AB123456)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search patients"
            />
            {search && (
              <button
                type="button"
                className="icon-btn search-clear"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>CIN</th>
                  <th>Phone</th>
                  <th>Birth Date</th>
                  <th>Address</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton cols={6} />
                ) : (
                  rows.map((p, i) => (
                    <tr key={p.id} className="animate-table-row" style={{ animationDelay: `${0.02 * (i + 1)}s` }}>
                      <td>
                        <div className="patient-cell">
                          <span className="patient-avatar">
                            {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                          <Link to={`/patients/${p.id}`} className="link patient-name">
                            {p.fullName}
                          </Link>
                        </div>
                      </td>
                      <td>
                        <span className="cin-badge">{p.cin}</span>
                      </td>
                      <td>
                        {p.phone ? (
                          <a href={`tel:${p.phone}`} className="phone-link">
                            {p.phone}
                          </a>
                        ) : (
                          <span className="muted">&mdash;</span>
                        )}
                      </td>
                      <td>{formatDate(p.birthDate)}</td>
                      <td>
                        <span className="address-cell" title={p.address || ''}>
                          {p.address || <span className="muted">&mdash;</span>}
                        </span>
                      </td>
                      <td className="right">
                        <button
                          className="btn sm icon"
                          title="Edit patient"
                          aria-label={`Edit ${p.fullName}`}
                          onClick={() => setEditing(p)}
                        >
                          <Icon name="edit" size={15} />
                        </button>{' '}
                        {isAdmin && (
                          <button
                            className="btn sm icon danger-ghost"
                            title="Archive / Delete patient"
                            aria-label={`Archive ${p.fullName}`}
                            onClick={() => setDeleting(p)}
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {!loading && rows.length === 0 && (
              <EmptyState
                title="No patients found"
                hint={q ? `No results for "${q}". Try another name or CIN.` : 'Click "Register Patient" above to add the first record.'}
              />
            )}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="pager">
            <span className="muted">
              Showing page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> ({meta.total} total)
            </span>
            <div className="pager-buttons">
              <button
                className="btn sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <Icon name="chevronLeft" size={15} /> Previous
              </button>{' '}
              <button
                className="btn sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next <Icon name="chevronRight" size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <PatientForm
          patient={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Archive Patient"
          message={`Are you sure you want to archive ${deleting.fullName} (${deleting.cin})? The record will be soft-deleted and preserved in the audit log.`}
          confirmLabel="Archive Patient"
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
