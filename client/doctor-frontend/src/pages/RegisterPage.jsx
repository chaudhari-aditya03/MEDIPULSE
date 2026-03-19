import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import { apiFetch } from '../lib/api';

const patientInitial = {
  role: 'patient',
  name: '',
  email: '',
  age: '',
  contactNumber: '',
  password: '',
  address: '',
};

const doctorInitial = {
  role: 'doctor',
  name: '',
  email: '',
  age: '',
  contactNumber: '',
  password: '',
  specialization: '',
  experience: '',
  hospitalId: '',
  licenseNumber: '',
  address: '',
  available: true,
  unavailableReason: '',
  activeHoursStart: '09:00',
  activeHoursEnd: '17:00',
};

function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState(patientInitial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hospitals, setHospitals] = useState([]);

  const activeTemplate = useMemo(() => (role === 'patient' ? patientInitial : doctorInitial), [role]);

  const changeRole = (newRole) => {
    setRole(newRole);
    setForm(newRole === 'patient' ? patientInitial : doctorInitial);
    setError('');
  };

  useEffect(() => {
    if (role !== 'doctor') return;

    apiFetch('/hospitals')
      .then((result) => setHospitals(result))
      .catch(() => setHospitals([]));
  }, [role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { activeHoursStart, activeHoursEnd, ...restForm } = form;

      await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          ...restForm,
          age: Number(restForm.age),
          ...(role === 'doctor'
            ? {
                experience: Number(restForm.experience),
                available: Boolean(restForm.available),
                unavailableReason: restForm.available ? '' : restForm.unavailableReason,
                activeHours: {
                  start: activeHoursStart,
                  end: activeHoursEnd,
                },
              }
            : {}),
        },
      });
      navigate('/login');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-white">
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-8">
          <h1 className="text-2xl font-black sm:text-3xl">Create Account</h1>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button type="button" onClick={() => changeRole('patient')} className={`rounded-full px-5 py-2 text-sm font-bold ${role === 'patient' ? 'bg-neon text-ink' : 'border border-white/20 text-slate-200'}`}>
              Patient
            </button>
            <button type="button" onClick={() => changeRole('doctor')} className={`rounded-full px-5 py-2 text-sm font-bold ${role === 'doctor' ? 'bg-neon text-ink' : 'border border-white/20 text-slate-200'}`}>
              Doctor
            </button>
          </div>

          {role === 'doctor' && hospitals.length > 0 && (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-200">Associated Hospital</span>
              <select
                name="hospitalId"
                value={form.hospitalId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none transition focus:border-neon"
              >
                <option value="">Select approved hospital</option>
                {hospitals.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {role === 'doctor' && hospitals.length === 0 && (
            <p className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
              No approved hospitals are available right now. Ask your hospital admin to register and get approved first.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.keys(activeTemplate).map((key) => {
              if (key === 'role') return null;
              if (['available', 'unavailableReason', 'activeHoursStart', 'activeHoursEnd'].includes(key)) return null;

              const isPassword = key === 'password';
              const type = isPassword ? 'password' : key === 'email' ? 'email' : 'text';

              if (role === 'doctor' && key === 'hospitalId') return null;
              return (
                <label key={key} className="block space-y-2">
                  <span className="text-sm font-semibold capitalize text-slate-200">{key}</span>
                  <input
                    type={type}
                    name={key}
                    value={form[key] || ''}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none transition focus:border-neon"
                  />
                </label>
              );
            })}
          </div>

          {role === 'doctor' && (
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-200">Availability Status</span>
                <select
                  value={form.available ? 'present' : 'absent'}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      available: event.target.value === 'present',
                    }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none transition focus:border-neon"
                >
                  <option value="present">Present in Hospital</option>
                  <option value="absent">Not Present in Hospital</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-200">Reason if Not Present</span>
                <input
                  type="text"
                  value={form.unavailableReason}
                  onChange={(event) => setForm((prev) => ({ ...prev, unavailableReason: event.target.value }))}
                  required={!form.available}
                  placeholder="On leave, emergency round, etc."
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none transition focus:border-neon"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-200">Active From</span>
                <input
                  type="time"
                  value={form.activeHoursStart}
                  onChange={(event) => setForm((prev) => ({ ...prev, activeHoursStart: event.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none transition focus:border-neon"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-200">Active Until</span>
                <input
                  type="time"
                  value={form.activeHoursEnd}
                  onChange={(event) => setForm((prev) => ({ ...prev, activeHoursEnd: event.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none transition focus:border-neon"
                  required
                />
              </label>
            </div>
          )}

          {error && <p className="rounded-xl border border-coral/50 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-xl bg-neon px-4 py-3 text-sm font-black uppercase tracking-wider text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
