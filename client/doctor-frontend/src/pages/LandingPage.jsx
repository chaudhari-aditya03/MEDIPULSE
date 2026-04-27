import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import { apiFetch } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { requestBrowserLocation } from '../lib/geolocation';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const FIRST_AID_ITEMS = [
  {
    key: 'bleeding',
    title: 'Bleeding',
    icon: '🩸',
    tone: 'rose',
    detail:
      'Apply firm, direct pressure with a clean cloth. If blood soaks through, add another layer instead of removing the first one.',
  },
  {
    key: 'cpr',
    title: 'CPR',
    icon: '🫀',
    tone: 'sky',
    detail:
      'If the person is unresponsive and not breathing, begin chest compressions in the center of the chest at 100-120 per minute.',
  },
  {
    key: 'burns',
    title: 'Burns',
    icon: '🔥',
    tone: 'amber',
    detail:
      'Cool the burn under cool running water for 10 minutes. Cover loosely with a clean dressing and avoid applying ice.',
  },
  {
    key: 'choking',
    title: 'Choking',
    icon: '😮‍💨',
    tone: 'violet',
    detail:
      'Use up to 5 back blows followed by 5 abdominal thrusts if the person cannot cough, breathe, or speak.',
  },
];

const HERO_BULLETS = ['Emergency dispatch', 'Live hospital routing', 'Nearby blood donors'];

const NETWORK_BADGE_CLASSES = {
  rose: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
  sky: 'border-sky/30 bg-sky/10 text-sky-200',
  neon: 'border-neon/30 bg-neon/10 text-neon',
};

const NETWORK_BADGE_TEXT_CLASSES = {
  rose: 'text-rose-300',
  sky: 'text-sky-300',
  neon: 'text-neon',
};

function LandingPage() {
  const session = getAuthSession();
  const [donorForm, setDonorForm] = useState({
    fullName: '',
    age: '',
    weightKg: '',
    bloodGroup: 'O+',
    contactNumber: '',
    lng: '',
    lat: '',
  });
  const [donorSubmitting, setDonorSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [donorLocationLoading, setDonorLocationLoading] = useState(false);
  const [openAidItem, setOpenAidItem] = useState('bleeding');
  const [liveStats, setLiveStats] = useState({
    activeUsers: 0,
    ambulancesAvailable: 0,
    hospitalsOnline: 0,
    bloodDonorsNearby: 0,
  });
  const [animatedStats, setAnimatedStats] = useState({
    activeUsers: 0,
    ambulancesAvailable: 0,
    hospitalsOnline: 0,
    bloodDonorsNearby: 0,
  });

  const ambulanceRouteHref = session?.role === 'patient' ? '/patient/dashboard' : '/register';
  const doctorPortalHref = session?.role === 'doctor' ? '/doctor/dashboard' : '/login';
  const hospitalPortalHref = session?.role === 'hospital' ? '/hospital/dashboard' : '/hospital/register';

  useEffect(() => {
    apiFetch('/visitor-counter/track', { method: 'POST' }).catch(() => null);

    let cancelled = false;

    async function loadDashboardStats() {
      try {
        const [hospitalsStats, ambulances, donorStats, visitors] = await Promise.all([
          apiFetch('/hospitals/public/stats').catch(() => ({})),
          apiFetch('/api/ambulances/public').catch(() => []),
          apiFetch('/api/donors/public/stats').catch(() => ({})),
          apiFetch('/visitor-counter/total').catch(() => ({ count: 0 })),
        ]);

        const donorData = donorStats?.data || donorStats || {};
        const availableAmbulances = Array.isArray(ambulances)
          ? ambulances.filter((ambulance) => ambulance.status === 'AVAILABLE').length
          : 0;

        if (!cancelled) {
          setLiveStats({
            activeUsers: Number(visitors?.count || 0),
            ambulancesAvailable: availableAmbulances,
            hospitalsOnline: Number(hospitalsStats?.approvedHospitals || 0),
            bloodDonorsNearby: Number(donorData?.totalAvailableDonors || 0),
          });
        }
      } catch (error) {
        console.error('Failed to load landing stats:', error);
      }
    }

    loadDashboardStats();
    const interval = setInterval(loadDashboardStats, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 900;
    let animationFrameId = 0;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;

      setAnimatedStats({
        activeUsers: Math.round(liveStats.activeUsers * eased),
        ambulancesAvailable: Math.round(liveStats.ambulancesAvailable * eased),
        hospitalsOnline: Math.round(liveStats.hospitalsOnline * eased),
        bloodDonorsNearby: Math.round(liveStats.bloodDonorsNearby * eased),
      });

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(tick);
      }
    };

    animationFrameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [liveStats]);

  const updateDonorFormValue = (event) => {
    const { name, value } = event.target;
    setDonorForm((prev) => ({ ...prev, [name]: value }));
  };

  const captureDonorLiveLocation = async () => {
    setDonorLocationLoading(true);
    try {
      const liveCoords = await requestBrowserLocation();
      setDonorForm((prev) => ({
        ...prev,
        lng: String(liveCoords?.lng || ''),
        lat: String(liveCoords?.lat || ''),
      }));
    } finally {
      setDonorLocationLoading(false);
    }
  };

  const speakAidInstructions = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const activeAid = FIRST_AID_ITEMS.find((item) => item.key === openAidItem) || FIRST_AID_ITEMS[0];
    const utterance = new SpeechSynthesisUtterance(`${activeAid.title}. ${activeAid.detail}`);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const submitDonorForm = async (event) => {
    event.preventDefault();
    setStatusMessage({ type: '', text: '' });

    const age = Number(donorForm.age);
    const weightKg = Number(donorForm.weightKg);

    if (age < 18) {
      setStatusMessage({ type: 'error', text: 'You must be 18 or older to donate blood.' });
      return;
    }

    if (weightKg <= 50) {
      setStatusMessage({ type: 'error', text: 'Weight must be greater than 50 kg.' });
      return;
    }

    setDonorSubmitting(true);
    try {
      let lng = Number(donorForm.lng);
      let lat = Number(donorForm.lat);

      if (!lng || !lat) {
        const liveCoords = await requestBrowserLocation();
        lng = Number(liveCoords?.lng);
        lat = Number(liveCoords?.lat);
      }

      if (!lng || !lat) throw new Error('Live GPS required to proceed.');

      await apiFetch('/api/donors/public/register', {
        method: 'POST',
        body: {
          fullName: donorForm.fullName,
          age,
          weightKg,
          bloodGroup: donorForm.bloodGroup,
          contactNumber: donorForm.contactNumber,
          lng,
          lat,
        },
      });

      setStatusMessage({ type: 'success', text: 'Thank you! You are now registered as a lifesaver.' });
      setDonorForm({ fullName: '', age: '', weightKg: '', bloodGroup: 'O+', contactNumber: '', lng: '', lat: '' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to register.' });
    } finally {
      setDonorSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-slate-100">
      <TopNav />

      <main className="relative pb-28 md:pb-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(63,140,255,0.2),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(35,213,171,0.18),transparent_24%),radial-gradient(circle_at_50%_85%,rgba(255,107,107,0.16),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,16,0.2)_0%,rgba(4,8,16,0.78)_72%,rgba(4,8,16,1)_100%)]" />

        <section id="top" className="relative mx-auto grid max-w-7xl gap-10 px-4 pt-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pt-20">
          <div className="animate-fadeUp space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 shadow-glow">
              Emergency network in motion
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
                Emergency Help in Seconds
              </h1>
              <p className="max-w-2xl text-lg text-slate-300 sm:text-xl">
                Ambulance • Hospitals • Doctors • Blood — All Connected
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {HERO_BULLETS.map((bullet) => (
                  <span key={bullet} className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    {bullet}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to={ambulanceRouteHref}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-rose-400/30 bg-gradient-to-r from-rose-500 to-red-600 px-7 py-4 text-base font-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_50px_rgba(244,63,94,0.45)] transition duration-300 hover:-translate-y-1 hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_70px_rgba(244,63,94,0.55)]"
              >
                🚑 Call Ambulance
              </Link>
              <Link
                to={doctorPortalHref}
                className="inline-flex items-center justify-center rounded-2xl border border-sky/30 bg-white/5 px-6 py-4 text-sm font-bold text-slate-100 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-sky/60 hover:bg-sky/10"
              >
                Doctor Portal
              </Link>
              <Link
                to={hospitalPortalHref}
                className="inline-flex items-center justify-center rounded-2xl border border-neon/30 bg-white/5 px-6 py-4 text-sm font-bold text-slate-100 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-neon/60 hover:bg-neon/10"
              >
                Hospital Login
              </Link>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {[
                { value: '24/7', label: 'Dispatch coverage' },
                { value: '60s', label: 'Average response target' },
                { value: '1 tap', label: 'Emergency access flow' },
              ].map((item) => (
                <div key={item.label} className="ui-panel border-white/10 p-4">
                  <div className="text-2xl font-black text-white">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-300">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fadeUp lg:pt-6" style={{ animationDelay: '0.08s' }}>
            <div className="ui-panel relative overflow-hidden border-white/10 p-5 shadow-panel sm:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(63,140,255,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(35,213,171,0.14),transparent_36%)]" />
              <div className="relative space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="ui-kicker text-sky-200">Live care grid</p>
                    <h2 className="mt-1 text-2xl font-black text-white">Tracking the emergency chain</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.2)]">
                    Online now
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>Dispatch center</span>
                      <span className="text-emerald-300">Live</span>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-2xl shadow-[0_0_0_1px_rgba(244,63,94,0.25)]">
                          🚑
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ambulance ETA</p>
                          <p className="text-lg font-black text-white">3 min away</p>
                        </div>
                      </div>
                      <div className="mt-4 h-24 rounded-2xl bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:20px_20px] bg-center">
                        <div className="relative h-full w-full overflow-hidden rounded-2xl">
                          <span className="absolute left-[18%] top-[34%] h-3 w-3 rounded-full bg-rose-400 shadow-[0_0_0_8px_rgba(244,63,94,0.12)]" />
                          <span className="absolute left-[38%] top-[52%] h-3 w-3 rounded-full bg-sky shadow-[0_0_0_8px_rgba(63,140,255,0.12)]" />
                          <span className="absolute left-[62%] top-[28%] h-3 w-3 rounded-full bg-neon shadow-[0_0_0_8px_rgba(35,213,171,0.12)]" />
                          <span className="absolute left-[72%] top-[62%] h-3 w-3 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.08)]" />
                          <div className="absolute left-[22%] top-[37%] h-[2px] w-[42%] bg-gradient-to-r from-rose-400 via-sky to-neon opacity-70" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Triage status</p>
                      <p className="mt-2 text-3xl font-black text-white">Critical</p>
                      <p className="mt-1 text-sm text-slate-300">Priority routed to the closest verified provider.</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">System trust</p>
                      <p className="mt-2 text-3xl font-black text-white">99.9%</p>
                      <p className="mt-1 text-sm text-slate-300">Verified providers, secure routing, always on.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { tone: 'rose', label: 'Emergency', value: 'Active' },
                    { tone: 'sky', label: 'Routing', value: 'Realtime' },
                    { tone: 'neon', label: 'Coverage', value: 'Networked' },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-2xl border px-4 py-3 text-center ${NETWORK_BADGE_CLASSES[item.tone]}`}>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                      <p className={`mt-1 text-lg font-black ${NETWORK_BADGE_TEXT_CLASSES[item.tone]}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                href: ambulanceRouteHref,
                icon: '🚑',
                title: 'Call Ambulance',
                text: 'Emergency dispatch with live location capture.',
                glow: 'rgba(244,63,94,0.35)',
              },
              {
                href: doctorPortalHref,
                icon: '👨‍⚕️',
                title: 'Doctor Portal',
                text: 'Login and manage care in one focused workspace.',
                glow: 'rgba(63,140,255,0.35)',
              },
              {
                href: hospitalPortalHref,
                icon: '🏥',
                title: 'Hospital Login',
                text: 'Coordinate ambulances, beds, and response teams.',
                glow: 'rgba(35,213,171,0.35)',
              },
              {
                href: '#blood-donor',
                icon: '🩸',
                title: 'Donate Blood',
                text: 'Join the nearby donor network for urgent cases.',
                glow: 'rgba(244,63,94,0.35)',
              },
            ].map((card) => (
              <Link
                key={card.title}
                to={card.href}
                className="ui-panel group flex flex-col gap-4 p-6 transition duration-300 hover:-translate-y-2 hover:border-white/20"
                style={{ boxShadow: `0 16px 50px rgba(0,0,0,0.38), 0 0 0 1px ${card.glow}` }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-3xl transition group-hover:scale-105">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="relative mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="ui-panel overflow-hidden border-white/10 p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="ui-kicker text-sky-200">Live dashboard</p>
                <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Real-time network visibility</h2>
                <p className="mt-2 max-w-2xl text-slate-300">
                  Watch the network update in real time while emergency teams, hospitals, and donors stay connected.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-4 py-2 text-sm font-bold text-neon shadow-glow">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neon" />
                </span>
                Live telemetry refreshed every 10s
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Active Users', value: animatedStats.activeUsers, icon: '👥', tone: 'sky' },
                { label: 'Ambulances Available', value: animatedStats.ambulancesAvailable, icon: '🚑', tone: 'rose' },
                { label: 'Hospitals Online', value: animatedStats.hospitalsOnline, icon: '🏥', tone: 'neon' },
                { label: 'Blood Donors Nearby', value: animatedStats.bloodDonorsNearby, icon: '🩸', tone: 'amberx' },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>{item.label}</span>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <div className={`mt-3 text-4xl font-black ${item.tone === 'sky' ? 'text-sky-300' : item.tone === 'rose' ? 'text-rose-300' : item.tone === 'neon' ? 'text-neon' : 'text-amber-300'}`}>
                    {item.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(7,13,26,0.95),rgba(15,18,34,0.92))] p-5 shadow-panel">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(35,213,171,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(63,140,255,0.15),transparent_28%)]" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="ui-kicker text-slate-200">Map preview</p>
                    <h3 className="mt-1 text-xl font-black text-white">Ambulance markers and coverage</h3>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                    City grid
                  </div>
                </div>
                <div className="relative mt-5 h-[320px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),radial-gradient(circle_at_20%_25%,rgba(63,140,255,0.16),transparent_32%),radial-gradient(circle_at_82%_70%,rgba(35,213,171,0.14),transparent_30%)] bg-[size:28px_28px,28px_28px,100%_100%,100%_100%] bg-center">
                  <div className="absolute inset-x-10 top-10 h-[2px] bg-gradient-to-r from-transparent via-sky to-transparent opacity-40" />
                  <div className="absolute inset-y-16 left-12 w-[2px] bg-gradient-to-b from-transparent via-neon to-transparent opacity-40" />
                  <div className="absolute left-[16%] top-[20%] rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-sm font-bold text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                    🚑 Dispatch
                  </div>
                  <div className="absolute left-[42%] top-[46%] h-4 w-4 rounded-full bg-sky shadow-[0_0_0_10px_rgba(63,140,255,0.15)]" />
                  <div className="absolute left-[68%] top-[30%] h-4 w-4 rounded-full bg-neon shadow-[0_0_0_10px_rgba(35,213,171,0.14)]" />
                  <div className="absolute left-[78%] top-[65%] h-4 w-4 rounded-full bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.08)]" />
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
                      <span>Closest unit: Metro Ambulance 04</span>
                      <span className="font-semibold text-neon">ETA 3 min</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <h3 className="text-xl font-black text-white">Network snapshot</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      ['Verified providers', 'Hospitals and doctors are filtered for active status.'],
                      ['Fast escalation', 'Emergency requests automatically prioritize the closest match.'],
                      ['Secure location sharing', 'GPS is only attached when the user grants access.'],
                    ].map(([title, detail]) => (
                      <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-sm font-bold text-white">{title}</div>
                        <div className="mt-1 text-sm text-slate-300">{detail}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-sky-500/10 via-white/5 to-neon/10 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="ui-kicker text-slate-200">Reliability</p>
                      <h3 className="mt-1 text-xl font-black text-white">Emergency-ready uptime</h3>
                    </div>
                    <div className="text-3xl">⚡</div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    {[
                      ['Verified', 'Yes'],
                      ['Secure', 'Yes'],
                      ['24/7', 'Yes'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
                        <div className="mt-2 text-lg font-black text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="ui-panel p-6 sm:p-8">
            <div className="text-center">
              <p className="ui-kicker text-slate-200">How it works</p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Three steps from panic to care</h2>
              <p className="mt-3 text-slate-300">The flow stays simple so users can act without thinking twice.</p>
            </div>

            <div className="relative mt-10 grid gap-5 lg:grid-cols-3">
              <div className="absolute left-8 right-8 top-10 hidden h-px bg-gradient-to-r from-sky/30 via-neon/50 to-coral/30 lg:block" />
              {[
                { icon: '🚨', title: 'Request Help', text: 'Start the emergency flow with one tap and share the location instantly.' },
                { icon: '⚡', title: 'Smart Match', text: 'The platform routes the request to the closest available hospital and ambulance.' },
                { icon: '💖', title: 'Get Care', text: 'Track the response in real time while receiving immediate guidance.' },
              ].map((step, index) => (
                <div key={step.title} className="relative rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-3xl shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                    {step.icon}
                  </div>
                  <div className="mt-5 inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                    Step {index + 1}
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="ui-panel p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="ui-kicker text-slate-200">First aid</p>
                  <h2 className="mt-2 text-3xl font-black text-white">What to do while help is on the way</h2>
                </div>
                <button
                  type="button"
                  onClick={speakAidInstructions}
                  className="rounded-2xl border border-sky/30 bg-sky/10 px-4 py-3 text-sm font-bold text-sky transition hover:bg-sky/20"
                >
                  Voice assist
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {FIRST_AID_ITEMS.map((item) => {
                  const isOpen = openAidItem === item.key;
                  const toneClass = item.tone === 'rose' ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : item.tone === 'sky' ? 'border-sky/30 bg-sky/10 text-sky-200' : item.tone === 'amber' ? 'border-amber-400/30 bg-amber-500/10 text-amber-200' : 'border-purple-400/30 bg-purple-500/10 text-purple-200';

                  return (
                    <div key={item.key} className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                      <button
                        type="button"
                        onClick={() => setOpenAidItem(isOpen ? '' : item.key)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-xl ${toneClass}`}>
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-lg font-black text-white">{item.title}</div>
                            <div className="text-sm text-slate-400">Tap to expand guidance</div>
                          </div>
                        </div>
                        <div className="text-2xl text-slate-400">{isOpen ? '−' : '+'}</div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-white/10 px-5 pb-5 text-sm leading-6 text-slate-300">
                          {item.detail}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div id="blood-donor" className="glass-panel border border-coral/20 p-6 sm:p-8">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-coral/30 bg-coral/10 text-3xl shadow-[0_0_25px_rgba(255,107,107,0.2)]">
                  🩸
                </div>
                <h2 className="mt-4 text-3xl font-black text-white">Be a Hero. Donate Blood.</h2>
                <p className="mt-2 text-slate-300">We contact you only when there is a critical emergency near your location.</p>
              </div>

              {statusMessage.text && (
                <div
                  className={`mt-6 rounded-2xl border p-4 text-center font-bold ${
                    statusMessage.type === 'error'
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                      : 'border-neon/40 bg-neon/10 text-neon'
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}

              <form onSubmit={submitDonorForm} className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-sm font-bold text-slate-300">Your Full Name</span>
                  <input
                    name="fullName"
                    value={donorForm.fullName}
                    onChange={updateDonorFormValue}
                    required
                    className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-white outline-none transition focus:border-neon focus:ring-1 focus:ring-neon"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-300">Age</span>
                  <input
                    type="number"
                    min="18"
                    name="age"
                    value={donorForm.age}
                    onChange={updateDonorFormValue}
                    required
                    className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-white outline-none transition focus:border-neon focus:ring-1 focus:ring-neon"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-300">Weight (kg)</span>
                  <input
                    type="number"
                    min="51"
                    name="weightKg"
                    value={donorForm.weightKg}
                    onChange={updateDonorFormValue}
                    required
                    className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-white outline-none transition focus:border-neon focus:ring-1 focus:ring-neon"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-slate-300">Blood Group</span>
                  <select
                    name="bloodGroup"
                    value={donorForm.bloodGroup}
                    onChange={updateDonorFormValue}
                    required
                    className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-white outline-none transition focus:border-neon focus:ring-1 focus:ring-neon"
                  >
                    {BLOOD_GROUP_OPTIONS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-sm font-bold text-slate-300">Phone Number</span>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={donorForm.contactNumber}
                    onChange={updateDonorFormValue}
                    required
                    className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 text-white outline-none transition focus:border-neon focus:ring-1 focus:ring-neon"
                  />
                </label>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={captureDonorLiveLocation}
                    disabled={donorLocationLoading}
                    className="w-full rounded-2xl border border-sky/40 bg-sky/10 px-4 py-3.5 text-sm font-bold text-sky transition hover:bg-sky/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {donorLocationLoading ? 'Finding Location...' : donorForm.lng ? 'Location Saved' : '📍 Attach Live Location'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={donorSubmitting}
                  className="sm:col-span-2 rounded-2xl bg-coral px-6 py-4 text-base font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_45px_rgba(255,107,107,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {donorSubmitting ? 'Registering...' : 'Register as Donor'}
                </button>
              </form>
            </div>
          </div>
        </section>

        <footer className="relative mt-10 border-t border-white/10">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
            <div>
              <div className="text-xl font-black text-white">MediPulse</div>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Built for immediate emergency response with secure routing, verified providers, and rapid access to care.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Verified', 'Secure', '24/7'].map((badge) => (
                  <span key={badge} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-2 text-sm font-semibold text-slate-300 sm:grid-cols-3 lg:items-start">
              <a href="#top" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/20 hover:bg-white/5">
                About
              </a>
              <a href="mailto:support@medipulse.health" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/20 hover:bg-white/5">
                Contact
              </a>
              <a href="#blood-donor" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/20 hover:bg-white/5">
                Privacy
              </a>
            </div>
          </div>
          <div className="border-t border-white/10 py-4 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} MediPulse. All rights reserved.
          </div>
        </footer>

        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07101d]/95 px-4 py-3 backdrop-blur-xl md:hidden">
          <Link
            to={ambulanceRouteHref}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-4 text-base font-black text-white shadow-[0_14px_35px_rgba(244,63,94,0.45)]"
          >
            🚑 Call Ambulance
          </Link>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
