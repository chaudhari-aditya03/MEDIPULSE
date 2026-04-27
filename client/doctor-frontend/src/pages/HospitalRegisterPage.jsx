import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import AuthCard from '../components/Auth/AuthCard';
import InputField from '../components/Auth/InputField';
import { apiFetch } from '../lib/api';
import { requestBrowserLocation } from '../lib/geolocation';

const DEPARTMENT_OPTIONS = [
  'Emergency',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'ICU',
  'Pediatrics',
  'Radiology',
  'General Medicine',
  'Surgery',
  'Trauma Care',
];

const initialForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  website: '',
  licenseNumber: '',
  beds: '',
  building: '',
  lane: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  lng: '',
  lat: '',
  description: '',
};

function validateField(name, value) {
  if (['name', 'email', 'password', 'phone', 'licenseNumber', 'building', 'lane', 'lng', 'lat'].includes(name) && !String(value).trim()) {
    return 'This field is required.';
  }

  if (name === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Enter a valid email address.';
  }

  if (name === 'password' && String(value).length < 6) {
    return 'Use at least 6 characters.';
  }

  if (name === 'beds' && value && Number(value) < 0) {
    return 'Beds cannot be negative.';
  }

  if (name === 'website' && value && !/^https?:\/\//i.test(value)) {
    return 'Website should start with http:// or https://';
  }

  return '';
}

function HospitalRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [licenseProofFile, setLicenseProofFile] = useState(null);

  const progressStep = useMemo(() => {
    const hasBasic = form.name && form.email && form.password && form.phone;
    if (!hasBasic) return 1;

    const hasMedical = form.licenseNumber && selectedDepartments.length > 0;
    if (!hasMedical) return 2;

    return 3;
  }, [form, selectedDepartments.length]);

  const fillLocationFromBrowser = async () => {
    setLocating(true);
    setLocationMessage('Requesting location permission...');

    try {
      const coords = await requestBrowserLocation();
      setForm((prev) => ({
        ...prev,
        lng: coords.lng,
        lat: coords.lat,
      }));
      setFieldErrors((prev) => ({ ...prev, lng: '', lat: '' }));
      setLocationMessage('Location auto-filled from your browser.');
    } catch (requestError) {
      setLocationMessage(requestError.message);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    fillLocationFromBrowser();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const toggleDepartment = (department) => {
    setSelectedDepartments((prev) => (prev.includes(department) ? prev.filter((item) => item !== department) : [...prev, department]));
  };

  const validateForm = () => {
    const nextErrors = {};
    Object.entries(form).forEach(([key, value]) => {
      const validationMessage = validateField(key, value);
      if (validationMessage) nextErrors[key] = validationMessage;
    });

    if (selectedDepartments.length === 0) {
      nextErrors.departments = 'Select at least one department.';
    }

    if (!licenseProofFile) {
      nextErrors.licenseProof = 'Attach license proof file.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm()) {
      setError('Please complete required fields before submitting.');
      return;
    }

    setLoading(true);

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
          departments: selectedDepartments,
          description: form.description,
          address: {
            building: form.building,
            lane: form.lane,
            street: form.street,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode,
            country: form.country,
          },
          lng: Number(form.lng),
          lat: Number(form.lat),
          licenseProofFileName: licenseProofFile?.name || '',
        },
      });

      setMessage('Hospital registered successfully. Wait for admin approval before login.');
      setForm(initialForm);
      setSelectedDepartments([]);
      setLicenseProofFile(null);
      setTimeout(() => navigate('/login'), 1600);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#0f172a_0%,#0b2c3d_100%)] text-white">
      <TopNav />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <AuthCard
          title="Hospital / Clinic Registration"
          subtitle="Register your institution and get verified for the MediPulse emergency network."
          headerSlot={
            <p className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-200">
              Step {progressStep} / 3
            </p>
          }
        >
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Basic Info</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InputField
                  label="Hospital Name"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  icon={<span>🏥</span>}
                  error={fieldErrors.name}
                />
                <InputField
                  label="Official Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  icon={<span>✉️</span>}
                  error={fieldErrors.email}
                />
                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  icon={<span>🔒</span>}
                  error={fieldErrors.password}
                />
                <InputField
                  label="Contact Number"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  required
                  icon={<span>📞</span>}
                  error={fieldErrors.phone}
                />
                <InputField
                  label="Website"
                  name="website"
                  value={form.website}
                  onChange={onChange}
                  icon={<span>🌐</span>}
                  placeholder="https://example.com"
                  error={fieldErrors.website}
                />
                <InputField label="Description" name="description" as="textarea" value={form.description} onChange={onChange} className="md:col-span-2" inputClassName="min-h-[120px]" placeholder="Short hospital profile" />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Medical Info</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InputField
                  label="License Number"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={onChange}
                  required
                  icon={<span>🪪</span>}
                  helper="Issued by health authority"
                  error={fieldErrors.licenseNumber}
                />
                <InputField
                  label="Number of Beds"
                  name="beds"
                  type="number"
                  min="0"
                  value={form.beds}
                  onChange={onChange}
                  icon={<span>🛏️</span>}
                  error={fieldErrors.beds}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-200">Departments (multi-select)</p>
                  <span className="text-xs text-slate-400">Choose one or more</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {DEPARTMENT_OPTIONS.map((department) => {
                    const active = selectedDepartments.includes(department);
                    return (
                      <button
                        key={department}
                        type="button"
                        onClick={() => toggleDepartment(department)}
                        className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-teal-300/50 bg-teal-500/20 text-teal-100'
                            : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                        }`}
                        aria-pressed={active}
                      >
                        {department}
                      </button>
                    );
                  })}
                </div>

                {selectedDepartments.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDepartments.map((department) => (
                      <span key={department} className="rounded-full border border-teal-300/40 bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-100">
                        {department}
                      </span>
                    ))}
                  </div>
                ) : null}

                {fieldErrors.departments ? <p className="mt-2 text-xs text-rose-300">{fieldErrors.departments}</p> : null}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <label className="block text-sm font-semibold text-slate-200" htmlFor="licenseProof">
                  License Proof Upload
                </label>
                <input
                  id="licenseProof"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setLicenseProofFile(file);
                    setFieldErrors((prev) => ({ ...prev, licenseProof: file ? '' : 'Attach license proof file.' }));
                  }}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm text-slate-200"
                  aria-invalid={Boolean(fieldErrors.licenseProof)}
                />
                <p className="mt-2 text-xs text-slate-400">Allowed formats: PDF, PNG, JPG. Max recommended size 5MB.</p>
                {licenseProofFile ? <p className="mt-1 text-xs text-teal-200">Selected: {licenseProofFile.name}</p> : null}
                {fieldErrors.licenseProof ? <p className="mt-1 text-xs text-rose-300">{fieldErrors.licenseProof}</p> : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Address Info</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InputField label="Building / House No." name="building" value={form.building} onChange={onChange} required icon={<span>🏢</span>} error={fieldErrors.building} />
                <InputField label="Lane / Area" name="lane" value={form.lane} onChange={onChange} required icon={<span>🛣️</span>} error={fieldErrors.lane} />
                <InputField label="Street" name="street" value={form.street} onChange={onChange} icon={<span>📍</span>} />
                <InputField label="City" name="city" value={form.city} onChange={onChange} icon={<span>🏙️</span>} />
                <InputField label="State" name="state" value={form.state} onChange={onChange} icon={<span>📌</span>} />
                <InputField label="Zip Code" name="zipCode" value={form.zipCode} onChange={onChange} icon={<span>🔢</span>} />
                <InputField label="Country" name="country" value={form.country} onChange={onChange} icon={<span>🌍</span>} />
                <InputField
                  label="Longitude"
                  name="lng"
                  value={form.lng}
                  onChange={onChange}
                  required
                  icon={<span>📌</span>}
                  helper="Auto-filled by browser"
                  error={fieldErrors.lng}
                />
                <InputField
                  label="Latitude"
                  name="lat"
                  value={form.lat}
                  onChange={onChange}
                  required
                  icon={<span>📍</span>}
                  helper="Auto-filled by browser"
                  error={fieldErrors.lat}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-300">Allow browser location once and latitude/longitude will auto-fill here.</p>
                  <button
                    type="button"
                    onClick={fillLocationFromBrowser}
                    disabled={locating}
                    className="min-h-[44px] rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {locating ? 'Fetching location...' : 'Use Current Location'}
                  </button>
                </div>
                {locationMessage ? <p className="mt-2 text-xs text-cyan-200">{locationMessage}</p> : null}
              </div>
            </section>

            {message ? <p className="rounded-xl border border-teal-300/50 bg-teal-500/10 px-4 py-3 text-sm text-teal-200">{message}</p> : null}
            {error ? <p className="rounded-xl border border-rose-400/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

            <div className="hidden items-center justify-between gap-4 sm:flex">
              <p className="text-sm text-slate-300">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-teal-300 transition hover:text-teal-200">
                  Go to Login
                </Link>
              </p>
              <button
                disabled={loading}
                className="min-h-[48px] rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl transition hover:scale-[1.01] hover:shadow-[0_16px_45px_rgba(20,184,166,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Submitting...' : 'Register Hospital'}
              </button>
            </div>
          </form>
        </AuthCard>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#091a2a]/95 px-4 py-3 backdrop-blur-lg sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-teal-300">
            Login
          </Link>
          <button
            onClick={(event) => {
              event.preventDefault();
              const formElement = document.querySelector('form');
              if (formElement) {
                formElement.requestSubmit();
              }
            }}
            disabled={loading}
            className="min-h-[48px] flex-1 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Submitting...' : 'Register Hospital'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HospitalRegisterPage;
