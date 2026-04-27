import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import AuthCard from '../components/Auth/AuthCard';
import InputField from '../components/Auth/InputField';
import { apiFetch } from '../lib/api';
import { requestBrowserLocation } from '../lib/geolocation';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_TONE = {
  'A+': 'bg-rose-500/20 text-rose-200 border-rose-400/40',
  'A-': 'bg-rose-500/20 text-rose-200 border-rose-400/40',
  'B+': 'bg-sky-500/20 text-sky-200 border-sky-400/40',
  'B-': 'bg-sky-500/20 text-sky-200 border-sky-400/40',
  'AB+': 'bg-violet-500/20 text-violet-200 border-violet-400/40',
  'AB-': 'bg-violet-500/20 text-violet-200 border-violet-400/40',
  'O+': 'bg-teal-500/20 text-teal-200 border-teal-400/40',
  'O-': 'bg-teal-500/20 text-teal-200 border-teal-400/40',
};

const patientInitial = {
  role: 'patient',
  name: '',
  email: '',
  age: '',
  contactNumber: '',
  bloodGroup: '',
  password: '',
  address: '',
  buildingAddress: '',
  laneAddress: '',
  lng: '',
  lat: '',
};

const doctorInitial = {
  role: 'doctor',
  name: '',
  email: '',
  age: '',
  contactNumber: '',
  bloodGroup: '',
  password: '',
  specialization: '',
  experience: '',
  hospitalId: '',
  licenseNumber: '',
  homeAddress: '',
  buildingAddress: '',
  laneAddress: '',
  lng: '',
  lat: '',
  available: true,
  unavailableReason: '',
  activeHoursStart: '09:00',
  activeHoursEnd: '17:00',
};

const driverInitial = {
  role: 'driver',
  driverName: '',
  vehicleNumber: '',
  driverPhone: '',
  email: '',
  password: '',
  driverBloodGroup: '',
  address: '',
  hospitalId: '',
  hospitalName: '',
  lng: '',
  lat: '',
};

function getTemplateByRole(role) {
  if (role === 'doctor') return doctorInitial;
  if (role === 'driver') return driverInitial;
  return patientInitial;
}

function validateSingleField(role, field, value) {
  if (['lng', 'lat'].includes(field) && !value) return 'Location is required.';

  if (field === 'email') {
    if (!value) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Enter a valid email address.';
  }

  if (field === 'password') {
    if (!value) return 'Password is required.';
    if (String(value).length < 6) return 'Use at least 6 characters.';
  }

  if (field === 'age' && role !== 'driver') {
    if (!value) return 'Age is required.';
    if (Number(value) < 18) return 'Minimum age is 18.';
  }

  if (['contactNumber', 'driverPhone'].includes(field)) {
    if (!value) return 'Phone number is required.';
    if (String(value).replace(/\D/g, '').length < 8) return 'Enter a valid phone number.';
  }

  if (field === 'experience' && role === 'doctor' && value && Number(value) < 0) {
    return 'Experience cannot be negative.';
  }

  if (field === 'hospitalId' && ['doctor', 'driver'].includes(role) && !value) {
    return 'Please select an associated hospital.';
  }

  if ((field === 'bloodGroup' || field === 'driverBloodGroup') && !value) {
    return 'Select blood group.';
  }

  if (field === 'name' && role !== 'driver' && !value) return 'Name is required.';
  if (field === 'driverName' && role === 'driver' && !value) return 'Driver name is required.';

  return '';
}

function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState(patientInitial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const progressStep = useMemo(() => {
    const hasCore = role === 'driver' ? form.driverName && form.email && form.password : form.name && form.email && form.password;
    if (!hasCore) return 1;

    const hasContact = role === 'driver' ? form.driverPhone : form.contactNumber && form.age;
    if (!hasContact) return 2;

    return 3;
  }, [form, role]);

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
      setLocationMessage('Location auto-detected successfully.');
      setFieldErrors((prev) => ({ ...prev, lng: '', lat: '' }));
    } catch (requestError) {
      setLocationMessage(requestError.message);
    } finally {
      setLocating(false);
    }
  };

  const changeRole = (newRole) => {
    setRole(newRole);
    const template = getTemplateByRole(newRole);
    setForm({
      ...template,
      lng: form.lng || '',
      lat: form.lat || '',
    });
    setFieldErrors({});
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    if (!['doctor', 'driver'].includes(role)) {
      setHospitals([]);
      return;
    }

    apiFetch('/hospitals')
      .then((result) => setHospitals(Array.isArray(result) ? result : []))
      .catch(() => setHospitals([]));
  }, [role]);

  useEffect(() => {
    fillLocationFromBrowser();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    const validationMessage = validateSingleField(role, name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: validationMessage }));
  };

  const validateForm = () => {
    const nextErrors = {};
    Object.keys(form).forEach((key) => {
      if (['role', 'available', 'unavailableReason', 'activeHoursStart', 'activeHoursEnd'].includes(key)) return;
      if (['doctor', 'driver'].includes(role) && key === 'hospitalName' && hospitals.length > 0) return;

      const message = validateSingleField(role, key, form[key]);
      if (message) nextErrors[key] = message;
    });

    if (role === 'doctor' && !form.available && !form.unavailableReason.trim()) {
      nextErrors.unavailableReason = 'Please provide reason when unavailable.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please fix the highlighted fields and try again.');
      return;
    }

    setLoading(true);

    try {
      const { activeHoursStart, activeHoursEnd, ...restForm } = form;

      await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          ...restForm,
          ...(role !== 'driver' ? { age: Number(restForm.age) } : {}),
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

      setSuccess('Registration successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
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
          title="Create MediPulse Account"
          subtitle="Join the emergency network with role-specific onboarding and real-time location setup."
          headerSlot={
            <p className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-200">
              Step {progressStep} / 3
            </p>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['patient', 'Patient'],
                ['doctor', 'Doctor'],
                ['driver', 'Ambulance Driver'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeRole(value)}
                  className={`min-h-[48px] rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                    role === value
                      ? 'border-teal-300/50 bg-teal-400/20 text-teal-100 shadow-[0_0_25px_rgba(20,184,166,0.22)]'
                      : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {['doctor', 'driver'].includes(role) && hospitals.length === 0 ? (
              <p className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
                No approved hospitals are available right now. Ask your hospital admin to register and get approved first.
              </p>
            ) : null}

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Step 1: Personal Info</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {role !== 'driver' ? (
                  <>
                    <InputField
                      label="Full Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      icon={<span>👤</span>}
                      placeholder="Enter your full name"
                      error={fieldErrors.name}
                    />
                    <InputField
                      label="Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      icon={<span>✉️</span>}
                      placeholder="name@example.com"
                      error={fieldErrors.email}
                    />
                    <InputField
                      label="Password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      icon={<span>🔒</span>}
                      placeholder="Minimum 6 characters"
                      error={fieldErrors.password}
                    />
                    <InputField
                      label="Age"
                      name="age"
                      type="number"
                      min="18"
                      value={form.age}
                      onChange={handleChange}
                      required
                      icon={<span>🎂</span>}
                      error={fieldErrors.age}
                    />
                    <InputField
                      label="Blood Group"
                      name="bloodGroup"
                      value={form.bloodGroup}
                      onChange={handleChange}
                      as="select"
                      required
                      icon={<span>🩸</span>}
                      className="md:col-span-2"
                      error={fieldErrors.bloodGroup}
                    >
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </InputField>
                    {form.bloodGroup ? (
                      <p className="md:col-span-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${BLOOD_TONE[form.bloodGroup]}`}>
                          Selected: {form.bloodGroup}
                        </span>
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <InputField
                      label="Driver Name"
                      name="driverName"
                      value={form.driverName}
                      onChange={handleChange}
                      required
                      icon={<span>👤</span>}
                      error={fieldErrors.driverName}
                    />
                    <InputField
                      label="Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      icon={<span>✉️</span>}
                      error={fieldErrors.email}
                    />
                    <InputField
                      label="Password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      icon={<span>🔒</span>}
                      error={fieldErrors.password}
                    />
                    <InputField
                      label="Blood Group"
                      name="driverBloodGroup"
                      value={form.driverBloodGroup}
                      onChange={handleChange}
                      as="select"
                      required
                      icon={<span>🩸</span>}
                      error={fieldErrors.driverBloodGroup}
                    >
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </InputField>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Step 2: Contact Info</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {role !== 'driver' ? (
                  <>
                    <InputField
                      label="Contact Number"
                      name="contactNumber"
                      value={form.contactNumber}
                      onChange={handleChange}
                      required
                      icon={<span>📞</span>}
                      error={fieldErrors.contactNumber}
                    />
                    <InputField label="Primary Address" name="address" value={form.address} onChange={handleChange} required icon={<span>🏠</span>} />
                    <InputField
                      label="Building / House No."
                      name="buildingAddress"
                      value={form.buildingAddress}
                      onChange={handleChange}
                      required
                      icon={<span>🏢</span>}
                    />
                    <InputField label="Lane / Area" name="laneAddress" value={form.laneAddress} onChange={handleChange} required icon={<span>🛣️</span>} />

                    {role === 'doctor' ? (
                      <>
                        <InputField
                          label="Specialization"
                          name="specialization"
                          value={form.specialization}
                          onChange={handleChange}
                          required
                          icon={<span>🩺</span>}
                        />
                        <InputField
                          label="Experience (years)"
                          name="experience"
                          type="number"
                          min="0"
                          value={form.experience}
                          onChange={handleChange}
                          required
                          icon={<span>⏳</span>}
                          error={fieldErrors.experience}
                        />
                        <InputField
                          label="License Number"
                          name="licenseNumber"
                          value={form.licenseNumber}
                          onChange={handleChange}
                          required
                          icon={<span>🪪</span>}
                        />
                        <InputField
                          label="Doctor Home Address"
                          name="homeAddress"
                          value={form.homeAddress}
                          onChange={handleChange}
                          required
                          icon={<span>📍</span>}
                        />
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    <InputField
                      label="Driver Phone"
                      name="driverPhone"
                      value={form.driverPhone}
                      onChange={handleChange}
                      required
                      icon={<span>📞</span>}
                      error={fieldErrors.driverPhone}
                    />
                    <InputField
                      label="Vehicle Number"
                      name="vehicleNumber"
                      value={form.vehicleNumber}
                      onChange={handleChange}
                      required
                      icon={<span>🚑</span>}
                    />
                    <InputField label="Driver Address" name="address" value={form.address} onChange={handleChange} required icon={<span>🏠</span>} />
                    {hospitals.length > 0 ? (
                      <InputField
                        label="Associated Hospital"
                        name="hospitalId"
                        value={form.hospitalId}
                        onChange={handleChange}
                        required
                        as="select"
                        icon={<span>🏥</span>}
                        error={fieldErrors.hospitalId}
                      >
                        <option value="">Select approved hospital</option>
                        {hospitals.map((hospital) => (
                          <option key={hospital._id} value={hospital._id}>
                            {hospital.name}
                          </option>
                        ))}
                      </InputField>
                    ) : (
                      <InputField label="Hospital Name" name="hospitalName" value={form.hospitalName} onChange={handleChange} required icon={<span>🏥</span>} />
                    )}
                  </>
                )}

                {role === 'doctor' && hospitals.length > 0 ? (
                  <InputField
                    label="Associated Hospital"
                    name="hospitalId"
                    value={form.hospitalId}
                    onChange={handleChange}
                    required
                    as="select"
                    icon={<span>🏥</span>}
                    error={fieldErrors.hospitalId}
                    className="md:col-span-2"
                  >
                    <option value="">Select approved hospital</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital._id} value={hospital._id}>
                        {hospital.name}
                      </option>
                    ))}
                  </InputField>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-lg font-black text-white">Step 3: Location Info</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InputField
                  label="Longitude"
                  name="lng"
                  value={form.lng}
                  onChange={handleChange}
                  required
                  icon={<span>📌</span>}
                  helper="Auto-filled from browser location"
                  error={fieldErrors.lng}
                />
                <InputField
                  label="Latitude"
                  name="lat"
                  value={form.lat}
                  onChange={handleChange}
                  required
                  icon={<span>📍</span>}
                  helper="Auto-filled from browser location"
                  error={fieldErrors.lat}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-300">Auto-detect your live location for faster emergency matching.</p>
                <button
                  type="button"
                  onClick={fillLocationFromBrowser}
                  disabled={locating}
                  className="min-h-[44px] rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {locating ? 'Fetching location...' : 'Use Current Location'}
                </button>
              </div>
              {locationMessage ? <p className="mt-2 text-xs text-cyan-200">{locationMessage}</p> : null}
            </section>

            {role === 'doctor' ? (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <h2 className="text-lg font-black text-white">Doctor Availability</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InputField label="Availability Status" name="availability" as="select" value={form.available ? 'present' : 'absent'} onChange={(event) => setForm((prev) => ({ ...prev, available: event.target.value === 'present' }))}>
                    <option value="present">Present in Hospital</option>
                    <option value="absent">Not Present in Hospital</option>
                  </InputField>
                  <InputField
                    label="Reason if Not Present"
                    name="unavailableReason"
                    value={form.unavailableReason}
                    onChange={(event) => {
                      const message = !form.available && !event.target.value.trim() ? 'Please provide reason when unavailable.' : '';
                      setFieldErrors((prev) => ({ ...prev, unavailableReason: message }));
                      setForm((prev) => ({ ...prev, unavailableReason: event.target.value }));
                    }}
                    required={!form.available}
                    placeholder="On leave, emergency round, etc."
                    error={fieldErrors.unavailableReason}
                  />
                  <InputField
                    label="Active From"
                    name="activeHoursStart"
                    type="time"
                    value={form.activeHoursStart}
                    onChange={(event) => setForm((prev) => ({ ...prev, activeHoursStart: event.target.value }))}
                    required
                  />
                  <InputField
                    label="Active Until"
                    name="activeHoursEnd"
                    type="time"
                    value={form.activeHoursEnd}
                    onChange={(event) => setForm((prev) => ({ ...prev, activeHoursEnd: event.target.value }))}
                    required
                  />
                </div>
              </section>
            ) : null}

            {success ? <p className="rounded-xl border border-teal-300/50 bg-teal-500/10 px-3 py-2 text-sm text-teal-200">{success}</p> : null}
            {error ? <p className="rounded-xl border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

            <div className="hidden items-center justify-between gap-4 sm:flex">
              <p className="text-sm text-slate-300">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-teal-300 transition hover:text-teal-200">
                  Login
                </Link>
              </p>
              <button
                disabled={loading}
                type="submit"
                className="min-h-[48px] rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl transition hover:scale-[1.01] hover:shadow-[0_16px_45px_rgba(20,184,166,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </AuthCard>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#091a2a]/95 px-4 py-3 backdrop-blur-lg sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link to="/login" className="text-sm font-semibold text-teal-300">
            Login
          </Link>
          <button
            formAction="#"
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
