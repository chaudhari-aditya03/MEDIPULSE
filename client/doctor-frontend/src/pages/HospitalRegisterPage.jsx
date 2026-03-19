import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import { apiFetch } from '../lib/api';

const initialForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  website: '',
  licenseNumber: '',
  beds: '',
  departments: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  description: '',
};

function HospitalRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiFetch('/hospitals/register', {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          website: form.website,
          licenseNumber: form.licenseNumber,
          beds: Number(form.beds || 0),
          departments: form.departments
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          description: form.description,
          address: {
            street: form.street,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: form.country,
          },
        },
      });

      setMessage('Hospital registered successfully. Wait for admin approval before login.');
      setForm(initialForm);
      setTimeout(() => navigate('/login'), 1800);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-white">
      <TopNav />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-8">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">Hospital / Clinic Registration</h1>
            <p className="mt-2 text-sm text-slate-300">Register your institution. Access is enabled only after admin approval.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input name="name" value={form.name} onChange={onChange} placeholder="Hospital Name" required className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Official Email" required className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Password" required className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="phone" value={form.phone} onChange={onChange} placeholder="Contact Number" required className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="licenseNumber" value={form.licenseNumber} onChange={onChange} placeholder="License Number" required className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="website" value={form.website} onChange={onChange} placeholder="Website" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="beds" type="number" value={form.beds} onChange={onChange} placeholder="Number of Beds" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="departments" value={form.departments} onChange={onChange} placeholder="Departments (comma separated)" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="street" value={form.street} onChange={onChange} placeholder="Street" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="city" value={form.city} onChange={onChange} placeholder="City" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="state" value={form.state} onChange={onChange} placeholder="State" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="zipCode" value={form.zipCode} onChange={onChange} placeholder="Zip Code" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
            <input name="country" value={form.country} onChange={onChange} placeholder="Country" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3" />
          </div>

          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Hospital description"
            className="h-28 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
          />

          {message && <p className="rounded-xl border border-neon/50 bg-neon/10 px-4 py-3 text-sm text-neon">{message}</p>}
          {error && <p className="rounded-xl border border-coral/50 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>}

          <button disabled={loading} className="rounded-xl bg-neon px-6 py-3 text-sm font-black text-ink">
            {loading ? 'Submitting...' : 'Register Hospital'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default HospitalRegisterPage;
