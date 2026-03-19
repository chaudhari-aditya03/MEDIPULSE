import { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import { apiFetch } from '../lib/api';
import { getAuthSession } from '../lib/auth';

function DoctorProfilePage() {
  const session = getAuthSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await apiFetch(`/doctors/${session.id}`, { token: session.token });
      setProfile({
        ...result,
        available: typeof result.available === 'boolean' ? result.available : true,
        unavailableReason: result.unavailableReason || '',
        activeHours: {
          start: result.activeHours?.start || '09:00',
          end: result.activeHours?.end || '17:00',
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateProfile = async (event) => {
    event.preventDefault();
    if (!profile) return;

    setMessage('');
    setError('');

    try {
      await apiFetch(`/doctors/${session.id}`, {
        method: 'PUT',
        token: session.token,
        body: {
          name: profile.name,
          age: Number(profile.age),
          contactNumber: profile.contactNumber,
          specialization: profile.specialization,
          experience: Number(profile.experience),
          address: profile.address,
          available: Boolean(profile.available),
          unavailableReason: profile.available ? '' : profile.unavailableReason,
          activeHours: {
            start: profile.activeHours?.start || '09:00',
            end: profile.activeHours?.end || '17:00',
          },
        },
      });

      setMessage('Profile updated successfully');
      await loadProfile();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-white">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h1 className="text-2xl font-black sm:text-3xl">Doctor Profile</h1>
          <p className="mt-2 text-sm text-slate-300">Update specialization and communication details visible in appointment flow.</p>

          {loading && <p className="mt-6 text-slate-300">Loading profile...</p>}

          {!loading && profile && (
            <form onSubmit={updateProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
              {['name', 'age', 'contactNumber', 'specialization', 'experience', 'address'].map((field) => (
                <label key={field} className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{field}</span>
                  <input
                    value={profile[field] ?? ''}
                    onChange={(event) => setProfile((prev) => ({ ...prev, [field]: event.target.value }))}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                    required
                  />
                </label>
              ))}

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Hospital Presence</span>
                <select
                  value={profile.available ? 'present' : 'absent'}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      available: event.target.value === 'present',
                    }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                >
                  <option value="present">Present in Hospital</option>
                  <option value="absent">Not Present in Hospital</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Reason if Absent</span>
                <input
                  value={profile.unavailableReason ?? ''}
                  onChange={(event) => setProfile((prev) => ({ ...prev, unavailableReason: event.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                  required={!profile.available}
                  placeholder="Reason for unavailability"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Active From</span>
                <input
                  type="time"
                  value={profile.activeHours?.start || '09:00'}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      activeHours: { ...(prev.activeHours || {}), start: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Until</span>
                <input
                  type="time"
                  value={profile.activeHours?.end || '17:00'}
                  onChange={(event) =>
                    setProfile((prev) => ({
                      ...prev,
                      activeHours: { ...(prev.activeHours || {}), end: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                  required
                />
              </label>

              <div className="sm:col-span-2">
                <button className="rounded-xl bg-neon px-5 py-3 text-sm font-black uppercase tracking-wider text-ink">Save Profile</button>
              </div>
            </form>
          )}

          {message && <p className="mt-4 rounded-xl border border-neon/50 bg-neon/10 px-3 py-2 text-sm text-neon">{message}</p>}
          {error && <p className="mt-4 rounded-xl border border-coral/50 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>}
        </section>
      </main>
    </div>
  );
}

export default DoctorProfilePage;
