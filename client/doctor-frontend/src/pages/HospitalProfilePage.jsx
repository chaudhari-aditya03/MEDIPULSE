import { useEffect, useMemo, useState } from 'react';
import TopNav from '../components/TopNav';
import AuthCard from '../components/Auth/AuthCard';
import InputField from '../components/Auth/InputField';
import { API_BASE_URL, apiFetch } from '../lib/api';
import { getAuthSession } from '../lib/auth';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  website: '',
  licenseNumber: '',
  licenseExpiry: '',
  beds: '',
  departments: '',
  description: '',
  building: '',
  lane: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  lng: '',
  lat: '',
};

const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

function HospitalProfilePage() {
  const session = getAuthSession();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [licenseProofFile, setLicenseProofFile] = useState(null);

  const currentCoordinates = useMemo(() => {
    const coordinates = profile?.location?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return { lng: '-', lat: '-' };
    }

    return {
      lng: coordinates[0],
      lat: coordinates[1],
    };
  }, [profile]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await apiFetch('/hospitals/me/profile', { token: session?.token });
      setProfile(result);
      setForm({
        name: result?.name || '',
        email: result?.email || '',
        phone: result?.phone || '',
        website: result?.website || '',
        licenseNumber: result?.licenseNumber || '',
        licenseExpiry: toInputDate(result?.licenseExpiry),
        beds: String(result?.beds ?? ''),
        departments: Array.isArray(result?.departments) ? result.departments.join(', ') : '',
        description: result?.description || '',
        building: result?.address?.building || '',
        lane: result?.address?.lane || '',
        street: result?.address?.street || '',
        city: result?.address?.city || '',
        state: result?.address?.state || '',
        zipCode: result?.address?.zipCode || '',
        country: result?.address?.country || '',
        lng: Array.isArray(result?.location?.coordinates) ? String(result.location.coordinates[0]) : '',
        lat: Array.isArray(result?.location?.coordinates) ? String(result.location.coordinates[1]) : '',
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [session?.token]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('email', form.email);
      payload.append('phone', form.phone);
      payload.append('website', form.website);
      payload.append('licenseNumber', form.licenseNumber);
      payload.append('licenseExpiry', form.licenseExpiry || '');
      payload.append('beds', form.beds || '0');
      payload.append('departments', form.departments);
      payload.append('description', form.description);
      payload.append('building', form.building);
      payload.append('lane', form.lane);
      payload.append('street', form.street);
      payload.append('city', form.city);
      payload.append('state', form.state);
      payload.append('zipCode', form.zipCode);
      payload.append('country', form.country);
      payload.append('lng', form.lng);
      payload.append('lat', form.lat);

      if (licenseProofFile) {
        payload.append('licenseProof', licenseProofFile);
      }

      const result = await apiFetch('/hospitals/me/profile', {
        method: 'PUT',
        token: session?.token,
        body: payload,
      });

      setMessage(result?.message || 'Hospital profile updated successfully.');
      setLicenseProofFile(null);
      await loadProfile();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#0f172a_0%,#0b2c3d_100%)] text-white">
      <TopNav />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <AuthCard title="Hospital Profile" subtitle="View and update the full registration details used by your hospital committee.">
          {loading ? <p className="text-slate-200">Loading profile...</p> : null}
          {error ? <p className="mb-4 rounded-xl border border-rose-400/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {message ? <p className="mb-4 rounded-xl border border-teal-300/50 bg-teal-500/10 px-4 py-3 text-sm text-teal-200">{message}</p> : null}

          {!loading && profile ? (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <h2 className="text-lg font-black">Account and Verification</h2>
                <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
                  <p>Status: <span className="font-bold text-white">{profile.status || '-'}</span></p>
                  <p>Verified: <span className="font-bold text-white">{profile.isVerified ? 'Yes' : 'No'}</span></p>
                  <p>Registered: <span className="font-bold text-white">{profile.registrationDate ? new Date(profile.registrationDate).toLocaleString() : '-'}</span></p>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <h2 className="text-lg font-black">Core Information</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InputField label="Hospital Name" name="name" value={form.name} onChange={onChange} required icon={<span>🏥</span>} />
                  <InputField label="Official Email" name="email" type="email" value={form.email} onChange={onChange} required icon={<span>✉️</span>} />
                  <InputField label="Contact Number" name="phone" value={form.phone} onChange={onChange} required icon={<span>📞</span>} />
                  <InputField label="Website" name="website" value={form.website} onChange={onChange} placeholder="https://example.com" icon={<span>🌐</span>} />
                  <InputField label="License Number" name="licenseNumber" value={form.licenseNumber} onChange={onChange} required icon={<span>🪪</span>} />
                  <InputField label="License Expiry" name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={onChange} icon={<span>📅</span>} />
                  <InputField label="Beds" name="beds" type="number" min="0" value={form.beds} onChange={onChange} icon={<span>🛏️</span>} />
                  <InputField label="Departments" name="departments" value={form.departments} onChange={onChange} helper="Comma separated, example: Emergency, Cardiology" icon={<span>🧬</span>} />
                  <InputField label="Description" name="description" as="textarea" value={form.description} onChange={onChange} className="md:col-span-2" inputClassName="min-h-[120px]" />
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <h2 className="text-lg font-black">Address and Geo Coordinates</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InputField label="Building / House No." name="building" value={form.building} onChange={onChange} required icon={<span>🏢</span>} />
                  <InputField label="Lane / Area" name="lane" value={form.lane} onChange={onChange} required icon={<span>🛣️</span>} />
                  <InputField label="Street" name="street" value={form.street} onChange={onChange} icon={<span>📍</span>} />
                  <InputField label="City" name="city" value={form.city} onChange={onChange} icon={<span>🏙️</span>} />
                  <InputField label="State" name="state" value={form.state} onChange={onChange} icon={<span>📌</span>} />
                  <InputField label="Zip Code" name="zipCode" value={form.zipCode} onChange={onChange} icon={<span>🔢</span>} />
                  <InputField label="Country" name="country" value={form.country} onChange={onChange} icon={<span>🌍</span>} />
                  <InputField label="Longitude" name="lng" value={form.lng} onChange={onChange} required icon={<span>📌</span>} />
                  <InputField label="Latitude" name="lat" value={form.lat} onChange={onChange} required icon={<span>📍</span>} />
                </div>
                <p className="mt-3 text-xs text-slate-300">Current stored coordinates: lng {currentCoordinates.lng}, lat {currentCoordinates.lat}</p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <h2 className="text-lg font-black">License Proof</h2>
                <div className="mt-4 grid gap-3 text-sm text-slate-200">
                  <p>Current file: {profile?.licenseProof?.originalName || profile?.licenseProof?.fileName || 'Not provided'}</p>
                  <p>Source: {profile?.licenseProof?.source || '-'}</p>
                  {profile?.licenseProof?.storagePath ? (
                    <a
                      href={`${API_BASE_URL}/uploads/${profile.licenseProof.storagePath.replace(/^uploads\//, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit rounded-lg border border-fuchsia-300/50 bg-fuchsia-300/20 px-3 py-1 text-xs font-bold text-fuchsia-100"
                    >
                      View Uploaded License Proof
                    </a>
                  ) : null}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-200" htmlFor="licenseProofUpload">
                    Replace License Proof (optional)
                  </label>
                  <input
                    id="licenseProofUpload"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(event) => setLicenseProofFile(event.target.files?.[0] || null)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm text-slate-200"
                  />
                  {licenseProofFile ? <p className="mt-1 text-xs text-teal-200">Selected file: {licenseProofFile.name}</p> : null}
                </div>
              </section>

              <button
                type="submit"
                disabled={saving}
                className="min-h-[48px] rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving Changes...' : 'Update Hospital Profile'}
              </button>
            </form>
          ) : null}
        </AuthCard>
      </main>
    </div>
  );
}

export default HospitalProfilePage;
