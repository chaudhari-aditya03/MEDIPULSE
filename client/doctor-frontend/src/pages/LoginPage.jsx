import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import AuthCard from '../components/Auth/AuthCard';
import InputField from '../components/Auth/InputField';
import { apiFetch, getDefaultRouteByRole } from '../lib/api';
import { setAuthSession } from '../lib/auth';

const iconClassName = 'h-5 w-5';

function MailIcon() {
  return (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 12s3.5-6 9-6a9.2 9.2 0 0 1 6.2 2.5" />
      <path d="M20.3 9.8A14.3 14.3 0 0 1 21 12s-3.5 6-9 6a9 9 0 0 1-4.1-1" />
      <path d="m4 4 16 16" />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await apiFetch('/auth/login', {
        method: 'POST',
        body: {
          email: form.email,
          password: form.password,
          ...(form.role ? { role: form.role } : {}),
        },
      });

      const session = setAuthSession(result.token);
      navigate(getDefaultRouteByRole(session.role));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(155deg,#0f172a_0%,#0b2c3d_100%)] text-white">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <section className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(20,184,166,0.18)] sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_42%),radial-gradient(circle_at_80%_100%,rgba(14,165,233,0.18),transparent_40%)]" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div>
                <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
                  Emergency-ready platform
                </p>
                <h2 className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl">
                  Coordinate emergency care with confidence.
                </h2>
                <p className="mt-4 max-w-md text-sm text-slate-200 sm:text-base">
                  Dispatch ambulances, sync hospitals, and keep every critical update in one trusted MediPulse flow.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['24/7', 'Live dispatch'],
                  ['Secure', 'Protected auth'],
                  ['Real-time', 'Network sync'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-md">
                    <p className="text-lg font-black text-white">{value}</p>
                    <p className="text-xs text-slate-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <AuthCard title="Welcome Back 👋" subtitle="Login to access MediPulse emergency services" className="animate-fadeUp">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <InputField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                autoComplete="email"
                required
                icon={<MailIcon />}
                placeholder="name@hospital.com"
              />

              <InputField
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                type={showPassword ? 'text' : 'password'}
                autoComplete={rememberMe ? 'current-password' : 'off'}
                required
                icon={<LockIcon />}
                placeholder="Enter your password"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="rounded-md p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                }
              />

              <InputField label="Login As" name="role" value={form.role} onChange={handleChange} as="select" icon={<span>🎯</span>}>
                <option value="">Auto detect</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="hospital">Hospital</option>
                <option value="driver">Ambulance Driver</option>
                <option value="admin">Admin</option>
              </InputField>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-teal-400 focus:ring-teal-400/40"
                  />
                  Remember me
                </label>
                <a href="#" className="text-sm font-semibold text-teal-300 transition hover:text-teal-200">
                  Forgot password?
                </a>
              </div>

              {error ? <p className="rounded-xl border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

              <button
                disabled={loading}
                type="submit"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl transition duration-300 hover:scale-[1.01] hover:shadow-[0_18px_50px_rgba(20,184,166,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m16.95 6.95-2.83-2.83M7.88 7.88 5.05 5.05m13.9 0-2.83 2.83m-8.24 8.24-2.83 2.83" />
                    </svg>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>

              <p className="text-center text-sm text-slate-300">
                New to MediPulse?{' '}
                <Link to="/register" className="font-semibold text-teal-300 transition hover:text-teal-200">
                  Create account
                </Link>
              </p>
            </form>
          </AuthCard>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
