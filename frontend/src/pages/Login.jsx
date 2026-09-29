import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field } from '../components/ui.jsx';
import Icon, { Logo } from '../components/Icon.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) v.email = 'Enter a valid email address';
    if (!form.password) v.password = 'Password is required';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg-decor" />
      <div className="login-box animate-card-enter">
        <div className="login-box-header">
          <div className="login-logo-container">
            <Logo size={62} />
          </div>
          <h1 className="login-title">ClinicFlow</h1>
          <p className="login-desc">Sign in to your clinical workspace</p>
        </div>

        {error && (
          <div className="alert animate-shake" role="alert">
            <Icon name="x" size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <Field label="Email address" error={errors.email}>
            <input
              type="email"
              autoComplete="username"
              placeholder="name@clinicflow.test"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={busy}
              autoFocus
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={busy}
              />
              <button
                type="button"
                className="icon-btn pass-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex="-1"
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
              </button>
            </div>
          </Field>

          <button className="btn primary block login-btn" disabled={busy}>
            {busy ? (
              <span className="btn-spinner-wrapper">
                <span className="spinner" />
                <span>Signing in…</span>
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-box-footer">
          <span>&copy; 2026 ClinicFlow &bull; All data secured</span>
        </div>
      </div>
    </div>
  );
}
