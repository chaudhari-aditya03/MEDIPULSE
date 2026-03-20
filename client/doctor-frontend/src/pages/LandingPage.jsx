import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import { apiFetch } from '../lib/api';
import { getAuthSession } from '../lib/auth';
import { requestBrowserLocation, reverseGeocodeCoordinates } from '../lib/geolocation';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function LandingPage() {
  const session = getAuthSession();
  const [platformStats, setPlatformStats] = useState({
    approvedHospitals: 0,
    approvedDoctors: 0,
    todayAppointments: 0,
  });
  const [visitorCount, setVisitorCount] = useState(0);
  const [ambulances, setAmbulances] = useState([]);
  const [donorForm, setDonorForm] = useState({
    fullName: '',
    age: '',
    weightKg: '',
    bloodGroup: 'O+',
    contactNumber: '',
    alternateContactNumber: '',
    address: '',
    lng: '',
    lat: '',
  });
  const [donorSubmitting, setDonorSubmitting] = useState(false);
  const [donorFormMessage, setDonorFormMessage] = useState('');
  const [donorFormError, setDonorFormError] = useState('');
  const [donorLocationLoading, setDonorLocationLoading] = useState(false);
  const [liveRefreshTick, setLiveRefreshTick] = useState(0);
  const [donorStats, setDonorStats] = useState({
    totalAvailableDonors: 0,
    bloodGroupBreakdown: [],
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await apiFetch('/hospitals/public/stats');
        setPlatformStats({
          approvedHospitals: result?.approvedHospitals ?? 0,
          approvedDoctors: result?.approvedDoctors ?? 0,
          todayAppointments: result?.todayAppointments ?? 0,
        });
      } catch {
        // Keep fallback values so landing page still renders when backend is unavailable.
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const loadLandingData = async () => {
      try {
        const [ambulanceResult, visitorResult, donorStatsResult] = await Promise.all([
          apiFetch('/api/ambulances/public').catch(() => []),
          apiFetch('/visitor-counter/total').catch(() => ({ count: 0 })),
          apiFetch('/api/donors/public/stats').catch(() => ({ totalAvailableDonors: 0, bloodGroupBreakdown: [] })),
        ]);

        setAmbulances(Array.isArray(ambulanceResult) ? ambulanceResult : []);
        setVisitorCount(Number(visitorResult?.count || 0));
        const resolvedDonorStats = donorStatsResult?.data && typeof donorStatsResult.data === 'object'
          ? donorStatsResult.data
          : donorStatsResult;
        setDonorStats({
          totalAvailableDonors: Number(resolvedDonorStats?.totalAvailableDonors || 0),
          bloodGroupBreakdown: Array.isArray(resolvedDonorStats?.bloodGroupBreakdown) ? resolvedDonorStats.bloodGroupBreakdown : [],
        });
      } catch {
        setAmbulances([]);
        setVisitorCount(0);
        setDonorStats({
          totalAvailableDonors: 0,
          bloodGroupBreakdown: [],
        });
      }
    };

    loadLandingData();
  }, []);

  useEffect(() => {
    apiFetch('/visitor-counter/track', { method: 'POST' }).catch(() => null);
  }, []);

  useEffect(() => {
    const handle = setInterval(() => {
      setLiveRefreshTick((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(handle);
  }, []);

  const features = [
    {
      tag: 'Unified Scheduling',
      title: 'One booking system for the full care ecosystem',
      description: 'Patients, doctors, and hospitals run on one synchronized appointment engine.',
    },
    {
      tag: 'Fast Dispatch',
      title: 'Nearest ambulance assignment in seconds',
      description: 'Live GPS trigger drives nearest-unit routing with incident details and contact context.',
    },
    {
      tag: 'Blood Network',
      title: 'Donor fallback built into emergency workflows',
      description: 'When blood banks are constrained, nearby donor discovery is available role-wise in real time.',
    },
    {
      tag: 'Realtime Control',
      title: 'Socket-powered updates across every role',
      description: 'Hospitals, doctors, drivers, and patients stay synchronized as incidents evolve.',
    },
  ];

  const activeAmbulances = ambulances.filter((item) => item.status === 'AVAILABLE').length;
  const busyAmbulances = ambulances.filter((item) => item.status === 'BUSY').length;

  const commandFlow = [
    {
      step: '01',
      title: 'Patient Raises Alert',
      detail: 'Emergency button captures context and incident coordinates.',
    },
    {
      step: '02',
      title: 'System Assigns Nearest Unit',
      detail: 'Ambulance + responders selected with geospatial routing.',
    },
    {
      step: '03',
      title: 'Driver Gets Immediate Details',
      detail: 'SMS and call flow include patient phone + address for validation.',
    },
    {
      step: '04',
      title: 'Hospital Monitors Completion',
      detail: 'Live dashboard updates incident status and operational metrics.',
    },
  ];

  const roleFlow = [
    {
      label: 'Patient',
      title: 'Trigger + Booking',
      detail: 'Raise emergency or schedule consultation.',
    },
    {
      label: 'Engine',
      title: 'Realtime Assignment',
      detail: 'Find nearest responders and route context.',
    },
    {
      label: 'Driver',
      title: 'Field Response',
      detail: 'Track incident and update ride status.',
    },
    {
      label: 'Hospital',
      title: 'Command + Completion',
      detail: 'Monitor, coordinate, and close incident.',
    },
  ];

  const heroHighlights = [
    {
      title: 'Emergency Ready',
      detail: 'One-click alerts with instant responder workflow.',
    },
    {
      title: 'Role Aware',
      detail: 'Patient, doctor, hospital, driver, and admin surfaces.',
    },
    {
      title: 'Blood Fallback',
      detail: 'Blood bank first, donor network as backup.',
    },
    {
      title: 'Realtime Updates',
      detail: 'Live status sync across the full care chain.',
    },
  ];

  const operationsTimeline = [
    { time: '00:00', event: 'Emergency initiated by patient app', status: 'critical' },
    { time: '00:08', event: 'Nearest ambulance auto-assigned', status: 'active' },
    { time: '00:22', event: 'Hospital command confirms intake', status: 'active' },
    { time: '01:10', event: 'Incident moved to completed care', status: 'resolved' },
  ];

  const roleCards = [
    {
      role: 'Patient',
      title: 'Book, Track, Trigger Emergency',
      description: 'Patients manage appointments and can raise emergency alerts in one flow.',
      route: session?.role === 'patient' ? '/patient/dashboard' : '/register',
      cta: session?.role === 'patient' ? 'Open Patient Dashboard' : 'Create Patient Account',
    },
    {
      role: 'Doctor',
      title: 'Consult, Update, Respond',
      description: 'Doctors handle appointments, prescriptions, and emergency notifications in realtime.',
      route: session?.role === 'doctor' ? '/doctor/dashboard' : '/login',
      cta: session?.role === 'doctor' ? 'Open Doctor Dashboard' : 'Doctor Login',
    },
    {
      role: 'Hospital',
      title: 'Operate Clinic + Ambulance Network',
      description: 'Hospitals manage teams, emergency alerts, and ambulance dispatch operations.',
      route: session?.role === 'hospital' ? '/hospital/dashboard' : '/hospital/register',
      cta: session?.role === 'hospital' ? 'Open Hospital Dashboard' : 'Register Hospital',
    },
  ];

  const updateDonorFormValue = (event) => {
    const { name, value } = event.target;
    setDonorForm((prev) => ({ ...prev, [name]: value }));
  };

  const captureDonorLiveLocation = async () => {
    setDonorLocationLoading(true);
    try {
      const liveCoords = await requestBrowserLocation();
      const lng = Number(liveCoords?.lng);
      const lat = Number(liveCoords?.lat);

      let placeName = '';
      try {
        placeName = await reverseGeocodeCoordinates(lng, lat);
      } catch {
        placeName = '';
      }

      setDonorForm((prev) => ({
        ...prev,
        lng: String(lng),
        lat: String(lat),
        address: prev.address || placeName || prev.address,
      }));

      return { lng, lat };
    } finally {
      setDonorLocationLoading(false);
    }
  };

  const submitDonorForm = async (event) => {
    event.preventDefault();
    setDonorFormError('');
    setDonorFormMessage('');

    const age = Number(donorForm.age);
    const weightKg = Number(donorForm.weightKg);

    if (!donorForm.fullName.trim()) {
      setDonorFormError('Please enter full name.');
      return;
    }

    if (!Number.isFinite(age) || age < 18) {
      setDonorFormError('Only persons age 18 or above can submit.');
      return;
    }

    if (!Number.isFinite(weightKg) || weightKg <= 50) {
      setDonorFormError('Weight must be greater than 50 kg.');
      return;
    }

    if (!donorForm.contactNumber.trim()) {
      setDonorFormError('Please enter contact number.');
      return;
    }

    setDonorSubmitting(true);

    try {
      let lng = Number(donorForm.lng);
      let lat = Number(donorForm.lat);

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        const liveCoords = await captureDonorLiveLocation();
        lng = Number(liveCoords?.lng);
        lat = Number(liveCoords?.lat);
      }

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        throw new Error('Live GPS is required. Please allow location access and try again.');
      }

      await apiFetch('/api/donors/public/register', {
        method: 'POST',
        body: {
          ...donorForm,
          age,
          weightKg,
          lng,
          lat,
          fullName: donorForm.fullName.trim(),
          contactNumber: donorForm.contactNumber.trim(),
          alternateContactNumber: donorForm.alternateContactNumber.trim(),
          address: donorForm.address.trim(),
        },
      });

      setDonorFormMessage('Donor details submitted successfully. Hospitals can use this in emergency blood requests.');
      setDonorForm({
        fullName: '',
        age: '',
        weightKg: '',
        bloodGroup: 'O+',
        contactNumber: '',
        alternateContactNumber: '',
        address: '',
        lng: '',
        lat: '',
      });
    } catch (error) {
      setDonorFormError(error?.message || 'Failed to submit donor details.');
    } finally {
      setDonorSubmitting(false);
    }
  };

  const trustStats = [
    { label: 'Hospitals Onboarded', value: platformStats.approvedHospitals || 10 },
    { label: 'Doctors Active', value: platformStats.approvedDoctors || 50 },
    { label: 'Emergencies Handled', value: platformStats.todayAppointments || 0 },
    { label: 'Platform Visitors', value: visitorCount || 1 },
  ];

  const donorGroupStats = BLOOD_GROUP_OPTIONS.map((group) => {
    const current = donorStats.bloodGroupBreakdown.find((item) => item.bloodGroup === group);
    return { bloodGroup: group, count: Number(current?.count || 0) };
  });

  return (
    <div className="min-h-screen bg-ink text-white">
      <TopNav />
      <main className="relative overflow-hidden pb-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(63,140,255,0.3),transparent_37%),radial-gradient(circle_at_95%_8%,rgba(35,213,171,0.2),transparent_36%),radial-gradient(circle_at_65%_100%,rgba(255,107,107,0.16),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-20 [background:linear-gradient(to_right,transparent_0,transparent_47%,rgba(255,255,255,0.08)_50%,transparent_53%,transparent_100%)] [background-size:24px_24px]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div className="grid gap-8 rounded-[2.25rem] border border-white/15 bg-gradient-to-br from-white/10 via-[#1b2548]/60 to-[#141b34]/70 p-5 shadow-glow backdrop-blur-xl sm:p-8 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="space-y-6 animate-fadeUp">
              <p className="inline-flex rounded-full border border-sky/55 bg-sky/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sky">
                Unified Emergency Care Intelligence
              </p>

              <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Smart Emergency & Healthcare
                <span className="block text-neon">Command Platform</span>
              </h1>

              <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
                From booking to emergency dispatch, MediPulse runs hospital operations, responder routing, blood support, and role-based care workflows in one connected system.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={session ? (session.role === 'hospital' ? '/hospital/dashboard' : session.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard') : '/register'}
                  className="rounded-full bg-neon px-6 py-3 text-sm font-black uppercase tracking-wider text-ink transition hover:brightness-110"
                >
                  {session ? 'Open My Workspace' : 'Start Free'}
                </Link>
                <Link
                  to="/hospital/register"
                  className="rounded-full border border-neon/60 px-6 py-3 text-sm font-black uppercase tracking-wider text-neon transition hover:bg-neon/10"
                >
                  Register Hospital
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fadeUp">
                {heroHighlights.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-widest text-neon">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-200">{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="grid gap-3 animate-fadeUp">
              <article className="rounded-3xl border border-white/15 bg-[#0f1a33]/92 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Live Dashboard Preview</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-300/20 px-2 py-1 text-[10px] font-bold text-emerald-200">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-200" />
                    Realtime
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-300/35 bg-emerald-300/10 p-3">
                    <p className="text-[11px] text-emerald-200">Active Ambulance</p>
                    <p className="mt-1 text-2xl font-black text-emerald-100">{activeAmbulances}</p>
                  </div>
                  <div className="rounded-xl border border-amber-300/35 bg-amber-300/10 p-3">
                    <p className="text-[11px] text-amber-200">Units In Transit</p>
                    <p className="mt-1 text-2xl font-black text-amber-100">{busyAmbulances}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] text-slate-300">Patient -&gt; Dispatch -&gt; Driver -&gt; Hospital</p>
                  <p className="mt-1 text-sm text-slate-100">Emergency click instantly pushes live incident coordinates and route links to responders.</p>

                  <div className="mt-3 rounded-lg border border-white/10 bg-[#101d3a] p-2">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-3/4 animate-float rounded-full bg-gradient-to-r from-neon via-sky to-coral" />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-300">Last updated {liveRefreshTick % 5} sec ago</p>
                  </div>
                </div>
              </article>

              <article className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-rose-300/10 to-transparent p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Blood Donor Intelligence</p>
                <p className="mt-2 text-sm text-slate-200">Live view of available donors and blood-group distribution.</p>
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#0d1730]/85 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-emerald-300/35 bg-emerald-300/10 p-2 text-[10px] text-emerald-100">
                      Available Donors
                      <p className="mt-1 text-sm font-black">{donorStats.totalAvailableDonors}</p>
                    </div>
                    <div className="rounded-md border border-cyan-300/35 bg-cyan-300/10 p-2 text-[10px] text-cyan-100">
                      Last Synced
                      <p className="mt-1 text-sm font-black">{liveRefreshTick % 5} sec ago</p>
                    </div>
                  </div>
                  <div className="mt-2 rounded-xl border border-white/10 bg-gradient-to-br from-[#1c2f56] to-[#0b1226] p-2">
                    <p className="text-[10px] uppercase tracking-wider text-slate-300">Blood Group Availability</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {donorGroupStats.map((item) => (
                        <div key={item.bloodGroup} className="flex items-center justify-between rounded bg-white/10 px-2 py-1 text-[10px] text-slate-100">
                          <span>{item.bloodGroup}</span>
                          <span className="font-black text-rose-100">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </aside>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trusted by modern healthcare teams</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trustStats.map((item) => (
                <article key={`trust-${item.label}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className="mt-1 text-2xl font-black">{item.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">See MediPulse In Action</h2>
              <p className="mt-2 text-sm text-slate-300">Live workflow preview showing emergency response orchestration.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {commandFlow.map((item) => (
              <article key={item.step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon">Step {item.step}</p>
                <h3 className="mt-2 text-lg font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Demo Playback</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-200">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-200" />
                Live demo
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/4 animate-float rounded-full bg-gradient-to-r from-neon via-sky to-coral" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-slate-200">Emergency Button Clicked</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-slate-200">Nearest Unit Assigned</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-slate-200">Driver Route Activated</div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">Why MediPulse</h2>
              <p className="mt-2 text-sm text-slate-300">Specific, measurable product capabilities beyond basic appointment apps.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12">
            {features.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 transition hover:-translate-y-0.5 hover:border-neon/40 ${
                  index === 1 ? 'xl:col-span-5' : index === 0 ? 'xl:col-span-4' : index === 2 ? 'xl:col-span-3' : index === 3 ? 'xl:col-span-7' : 'xl:col-span-5'
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neon">{item.tag}</p>
                <h3 className="mt-2 text-lg font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-white/5 p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Operational Intelligence Hub</h2>
                <p className="mt-2 text-sm text-slate-300">Incident command timeline and readiness signals without map dependency.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl border border-white/10 bg-[#0d1730]/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Incident Timeline</p>
                <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  {operationsTimeline.map((item) => (
                    <div key={`${item.time}-${item.event}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
                      <span className="font-black text-cyan-200">{item.time}</span>
                      <span className="text-slate-200">{item.event}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.status === 'critical'
                          ? 'bg-rose-300/20 text-rose-100'
                          : item.status === 'resolved'
                            ? 'bg-emerald-300/20 text-emerald-100'
                            : 'bg-amber-300/20 text-amber-100'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <div className="space-y-3">
                <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">System Readiness</p>
                  <p className="mt-2 text-sm text-slate-200">Emergency pipeline health across key modules.</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
                        <span>Dispatch Engine</span>
                        <span>99%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-full w-[99%] rounded-full bg-emerald-300" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
                        <span>Notification Layer</span>
                        <span>97%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-full w-[97%] rounded-full bg-cyan-300" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
                        <span>Blood Support Matching</span>
                        <span>94%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-full w-[94%] rounded-full bg-amber-300" />
                      </div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current Fleet Snapshot</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-3">
                      <p className="text-[11px] text-emerald-200">Available Units</p>
                      <p className="mt-1 text-xl font-black text-emerald-100">{activeAmbulances}</p>
                    </div>
                    <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3">
                      <p className="text-[11px] text-amber-200">In Transit</p>
                      <p className="mt-1 text-xl font-black text-amber-100">{busyAmbulances}</p>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">How MediPulse Works</h2>
                <p className="mt-2 text-sm text-slate-300">Architecture-level flow from emergency trigger to care completion.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {roleFlow.map((item, index) => (
                <article key={`flow-${item.label}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neon">{item.label}</p>
                  <p className="mt-2 font-bold text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                  {index < roleFlow.length - 1 && <p className="mt-2 text-xs text-slate-300">Flow -&gt;</p>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black sm:text-3xl">Role-Based System Journey</h2>
            <p className="mt-2 text-sm text-slate-300">Clear role flow across patient, doctor, and hospital command surfaces.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {roleCards.map((item) => (
              <article key={item.role} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">{item.role}</p>
                <h3 className="mt-2 text-lg font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                <Link
                  to={item.route}
                  className="mt-4 inline-flex rounded-full border border-white/30 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10"
                >
                  {item.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-3xl border border-white/15 bg-gradient-to-br from-[#162346]/80 via-[#111a33]/70 to-[#1b2740]/70 p-5 sm:p-8 lg:grid-cols-[1fr_1.15fr]">
            <aside className="space-y-3">
              <p className="inline-flex rounded-full border border-red-300/40 bg-red-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-red-100">
                Emergency Blood Support
              </p>
              <h2 className="text-2xl font-black text-white sm:text-3xl">Community Donor Dashboard</h2>
              <p className="text-sm text-slate-200">
                Submit donor details here. Only eligible donors with age 18+ and weight greater than 50 kg are stored. This helps hospitals quickly contact matching blood groups during emergencies.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200">
                Required: name, age, weight, blood group, primary contact.
              </div>
              <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs text-amber-100">
                Unique module: Blood bank to donor fallback network for emergency scenarios.
              </div>
            </aside>

            <form onSubmit={submitDonorForm} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Full Name</span>
                <input
                  name="fullName"
                  value={donorForm.fullName}
                  onChange={updateDonorFormValue}
                  placeholder="Enter full name"
                  className="rounded-xl border border-white/15 bg-[#0d1831] px-3 py-2 text-sm text-white outline-none transition focus:border-neon"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Age</span>
                <input
                  type="number"
                  min="18"
                  name="age"
                  value={donorForm.age}
                  onChange={updateDonorFormValue}
                  placeholder="18"
                  className="rounded-xl border border-white/15 bg-[#0d1831] px-3 py-2 text-sm text-white outline-none transition focus:border-neon"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Weight (kg)</span>
                <input
                  type="number"
                  min="51"
                  step="0.1"
                  name="weightKg"
                  value={donorForm.weightKg}
                  onChange={updateDonorFormValue}
                  placeholder="51"
                  className="rounded-xl border border-white/15 bg-[#0d1831] px-3 py-2 text-sm text-white outline-none transition focus:border-neon"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Blood Group</span>
                <select
                  name="bloodGroup"
                  value={donorForm.bloodGroup}
                  onChange={updateDonorFormValue}
                  className="rounded-xl border border-white/15 bg-[#0d1831] px-3 py-2 text-sm text-white outline-none transition focus:border-neon"
                  required
                >
                  {BLOOD_GROUP_OPTIONS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Primary Contact</span>
                <input
                  name="contactNumber"
                  value={donorForm.contactNumber}
                  onChange={updateDonorFormValue}
                  placeholder="10-digit phone number"
                  className="rounded-xl border border-white/15 bg-[#0d1831] px-3 py-2 text-sm text-white outline-none transition focus:border-neon"
                  required
                />
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Alternate Contact (optional)</span>
                <input
                  name="alternateContactNumber"
                  value={donorForm.alternateContactNumber}
                  onChange={updateDonorFormValue}
                  placeholder="Optional"
                  className="rounded-xl border border-white/15 bg-[#0d1831] px-3 py-2 text-sm text-white outline-none transition focus:border-neon"
                />
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Address / Area</span>
                <textarea
                  name="address"
                  value={donorForm.address}
                  onChange={updateDonorFormValue}
                  rows={2}
                  placeholder="Area, city or landmark"
                  className="rounded-xl border border-white/15 bg-[#0d1831] px-3 py-2 text-sm text-white outline-none transition focus:border-neon"
                />
              </label>

              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={donorForm.lng}
                  readOnly
                  placeholder="Live Longitude"
                  className="rounded-xl border border-white/15 bg-[#0d1831] px-3 py-2 text-sm text-white/80"
                />
                <input
                  value={donorForm.lat}
                  readOnly
                  placeholder="Live Latitude"
                  className="rounded-xl border border-white/15 bg-[#0d1831] px-3 py-2 text-sm text-white/80"
                />
                <button
                  type="button"
                  onClick={captureDonorLiveLocation}
                  disabled={donorLocationLoading}
                  className="rounded-xl border border-cyan-300/50 bg-cyan-300/20 px-3 py-2 text-xs font-bold text-cyan-100 disabled:opacity-60"
                >
                  {donorLocationLoading ? 'Detecting...' : 'Use Live GPS'}
                </button>
              </div>

              {donorFormError && (
                <p className="rounded-xl border border-red-300/40 bg-red-300/10 px-3 py-2 text-xs font-semibold text-red-100 sm:col-span-2">{donorFormError}</p>
              )}
              {donorFormMessage && (
                <p className="rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100 sm:col-span-2">{donorFormMessage}</p>
              )}

              <button
                type="submit"
                disabled={donorSubmitting}
                className="rounded-full bg-neon px-5 py-2.5 text-sm font-black uppercase tracking-wider text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
              >
                {donorSubmitting ? 'Submitting...' : 'Submit Donor Details'}
              </button>
            </form>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <h2 className="text-2xl font-black sm:text-3xl">Works Anywhere</h2>
            <p className="mt-2 text-sm text-slate-300">Responsive dashboard previews optimized for mobile, tablet, and command-center desktops.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-[#0d1831]/85 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mobile</p>
                <div className="mt-2 h-44 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-sky/30 via-[#152445] to-[#0d1730] p-2 shadow-glow">
                  <div className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-bold text-white">Patient Dashboard</div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <div className="rounded-md border border-emerald-300/40 bg-emerald-300/10 p-1.5 text-[10px] text-emerald-100">Nearby Hospital</div>
                    <div className="rounded-md border border-amber-300/40 bg-amber-300/10 p-1.5 text-[10px] text-amber-100">Ambulance ETA</div>
                  </div>
                  <div className="mt-2 rounded-md border border-white/10 bg-white/10 p-2">
                    <div className="h-2 w-3/4 rounded-full bg-neon/80" />
                    <div className="mt-1 h-2 w-1/2 rounded-full bg-sky/70" />
                  </div>
                  <div className="mt-2 rounded-md border border-rose-300/30 bg-rose-300/15 px-2 py-1 text-center text-[10px] font-bold text-rose-100">
                    Emergency Alert
                  </div>
                </div>
              </article>
              <article className="rounded-2xl border border-white/10 bg-[#0d1831]/85 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tablet</p>
                <div className="mt-2 h-44 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-neon/25 via-[#17304a] to-[#0d1730] p-2 shadow-glow">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[10px]">
                    <span className="font-bold text-white">Hospital Dashboard</span>
                    <span className="rounded-full border border-cyan-300/40 px-1.5 py-0.5 text-cyan-100">Live</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <div className="rounded-md border border-white/10 bg-white/10 p-1.5 text-[10px] text-slate-200">Doctors</div>
                    <div className="rounded-md border border-white/10 bg-white/10 p-1.5 text-[10px] text-slate-200">Patients</div>
                    <div className="rounded-md border border-white/10 bg-white/10 p-1.5 text-[10px] text-slate-200">Revenue</div>
                  </div>
                  <div className="mt-2 rounded-md border border-white/10 bg-white/10 p-2">
                    <div className="h-2 rounded-full bg-cyan-300/70" />
                    <div className="mt-1 h-2 w-4/5 rounded-full bg-emerald-300/70" />
                    <div className="mt-1 h-2 w-3/5 rounded-full bg-amber-300/70" />
                  </div>
                </div>
              </article>
              <article className="rounded-2xl border border-white/10 bg-[#0d1831]/85 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Desktop</p>
                <div className="mt-2 h-44 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-coral/25 via-[#2a1f3f] to-[#0d1730] p-2 shadow-glow">
                  <div className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-bold text-white">Admin Command Center</div>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    <div className="rounded-md border border-white/10 bg-white/10 p-1 text-[10px] text-slate-200">Hospitals</div>
                    <div className="rounded-md border border-white/10 bg-white/10 p-1 text-[10px] text-slate-200">Doctors</div>
                    <div className="rounded-md border border-white/10 bg-white/10 p-1 text-[10px] text-slate-200">Donors</div>
                    <div className="rounded-md border border-white/10 bg-white/10 p-1 text-[10px] text-slate-200">Reports</div>
                  </div>
                  <div className="mt-2 rounded-md border border-white/10 bg-white/10 p-2">
                    <div className="grid grid-cols-3 gap-1">
                      <div className="h-8 rounded bg-sky/35" />
                      <div className="h-8 rounded bg-neon/35" />
                      <div className="h-8 rounded bg-coral/35" />
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-neon/40 bg-gradient-to-r from-neon/20 via-sky/15 to-coral/15 p-6 text-center sm:p-10">
            <h2 className="text-2xl font-black text-white sm:text-4xl">Ready to Save Lives with Smart Emergency Tech?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-100 sm:text-base">
              Launch with role-based workflows, emergency command automation, and field-ready response systems.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {!session && (
                <Link
                  to="/register"
                  className="rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-wider text-ink transition hover:brightness-95"
                >
                  Start as Patient
                </Link>
              )}
              <Link
                to="/hospital/register"
                className="rounded-full border border-neon/60 px-6 py-3 text-sm font-black uppercase tracking-wider text-neon transition hover:bg-neon/10"
              >
                Register Hospital
              </Link>
              {!session && (
                <Link
                  to="/login"
                  className="rounded-full border border-white/50 px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10"
                >
                  Login To Existing Workspace
                </Link>
              )}
              {session && (
                <Link
                  to={session?.role === 'hospital' ? '/hospital/dashboard' : session?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                  className="rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-wider text-ink transition hover:brightness-95"
                >
                  Open My Dashboard
                </Link>
              )}
            </div>
          </div>
        </section>

        <footer className="relative mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 py-8 text-sm text-slate-300 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neon">MediPulse</p>
              <p className="mt-2 text-slate-300">Emergency-ready healthcare command platform for real-time patient response and coordinated care.</p>
            </div>
            <div>
              <p className="font-bold text-white">Product</p>
              <p className="mt-2">Appointments</p>
              <p>Emergency Dispatch</p>
              <p>Blood Donor Discovery</p>
            </div>
            <div>
              <p className="font-bold text-white">Company</p>
              <p className="mt-2">Privacy</p>
              <p>Terms</p>
              <p>Contact</p>
            </div>
            <div>
              <p className="font-bold text-white">Links</p>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="mt-2 block hover:text-white">GitHub</a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="block hover:text-white">LinkedIn</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LandingPage;
