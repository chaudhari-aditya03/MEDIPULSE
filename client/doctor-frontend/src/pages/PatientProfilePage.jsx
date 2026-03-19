import { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import { apiFetch } from '../lib/api';
import { getAuthSession } from '../lib/auth';

function PatientProfilePage() {
  const session = getAuthSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await apiFetch(`/patients/${session.id}`, { token: session.token });
      setProfile(result);
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
      await apiFetch(`/patients/${session.id}`, {
        method: 'PUT',
        token: session.token,
        body: {
          name: profile.name,
          age: Number(profile.age),
          contactNumber: profile.contactNumber,
          address: profile.address,
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
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h1 className="text-2xl font-black sm:text-3xl">My Profile</h1>
          <p className="mt-2 text-sm text-slate-300">Manage personal information used for appointment records.</p>

          {loading && <p className="mt-6 text-slate-300">Loading profile...</p>}

          {!loading && profile && (
            <form onSubmit={updateProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Name</span>
                <input value={profile.name || ''} onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3" required />
              </label>

              <label className="space-y-2 sm:col-span-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Age</span>
                <input type="number" min="0" value={profile.age || ''} onChange={(event) => setProfile((prev) => ({ ...prev, age: event.target.value }))} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3" required />
              </label>

              <label className="space-y-2 sm:col-span-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Contact Number</span>
                <input value={profile.contactNumber || ''} onChange={(event) => setProfile((prev) => ({ ...prev, contactNumber: event.target.value }))} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3" required />
              </label>

              <label className="space-y-2 sm:col-span-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Address</span>
                <input value={profile.address || ''} onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))} className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3" required />
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

export default PatientProfilePage;
