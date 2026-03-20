import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import { apiFetch } from '../lib/api';
import { getAuthSession } from '../lib/auth';

function LandingPage() {
  const session = getAuthSession();
  const [platformStats, setPlatformStats] = useState({
    approvedHospitals: 0,
    approvedDoctors: 0,
    todayAppointments: 0,
    recentBooking: null,
  });
  const [visitorCount, setVisitorCount] = useState(0);
  const [ambulances, setAmbulances] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await apiFetch('/hospitals/public/stats');
        setPlatformStats({
          approvedHospitals: result?.approvedHospitals ?? 0,
          approvedDoctors: result?.approvedDoctors ?? 0,
          todayAppointments: result?.todayAppointments ?? 0,
          recentBooking: result?.recentBooking ?? null,
        });
      } catch {
        // Keep fallback values so landing page still renders when backend is unavailable.
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const loadAmbulances = async () => {
      try {
        const result = await apiFetch('/api/ambulances/public');
        setAmbulances(Array.isArray(result) ? result : []);
      } catch {
        setAmbulances([]);
      }
    };

    loadAmbulances();
  }, []);

  // Track visitor on page load
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        // Track the visitor
        const trackResponse = await fetch('https://medipulse-1sje.onrender.com/visitor-counter/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!trackResponse.ok) {
          console.error('Track failed:', trackResponse.status, trackResponse.statusText);
        }
        
        // Fetch and display the current count
        const countResponse = await fetch('https://medipulse-1sje.onrender.com/visitor-counter/total');
        if (!countResponse.ok) {
          console.error('Fetch count failed:', countResponse.status);
          return;
        }
        
        const data = await countResponse.json();
        console.log('Visitor count:', data.count);
        setVisitorCount(data.count || 0);
      } catch (error) {
        console.error('Visitor counter error:', error);
      }
    };

    trackVisitor();
  }, []);

  const features = [
    {
      icon: '📅',
      title: 'Appointment Scheduling',
      description: 'Create, reschedule, and track appointments with smart status updates in one flow.',
    },
    {
      icon: '🩺',
      title: 'Doctor Management',
      description: 'Manage doctor profiles, specialty mapping, and live availability from one dashboard.',
    },
    {
      icon: '💊',
      title: 'Prescription System',
      description: 'Store diagnosis and prescriptions securely with clear records for every patient.',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Visualize bookings, patient volume, and clinic performance with actionable metrics.',
    },
    {
      icon: '🔔',
      title: 'Notifications',
      description: 'Keep patients, doctors, and admins in sync with instant appointment alerts.',
    },
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      note: 'For new clinics starting digital operations',
      points: ['Basic scheduling', 'Patient records', 'Email support'],
    },
    {
      name: 'Pro',
      price: '$49/mo',
      note: 'For growing teams with multi-role workflows',
      points: ['Everything in Free', 'Prescription workflow', 'Live analytics'],
      featured: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      note: 'For large hospitals and multi-branch systems',
      points: ['Everything in Pro', 'Priority onboarding', 'Dedicated success manager'],
    },
  ];

  return (
    <div className="min-h-screen bg-ink text-white">
      <TopNav />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(37,99,235,0.35),transparent_38%),radial-gradient(circle_at_84%_20%,rgba(16,185,129,0.25),transparent_36%),radial-gradient(circle_at_60%_84%,rgba(244,114,182,0.2),transparent_42%)]" />

        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-8 rounded-[2rem] border border-white/15 bg-gradient-to-br from-white/10 to-white/5 p-5 backdrop-blur-xl sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-fadeUp space-y-6">
              <p className="inline-flex rounded-full border border-neon/45 bg-neon/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-neon">
                Clinic Operations Platform
              </p>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">All-in-One Clinic Management System</h1>
              <p className="max-w-2xl text-base text-slate-200 sm:text-lg">Manage appointments, patients, and prescriptions effortlessly</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/patient/dashboard"
                  className="rounded-full bg-neon px-6 py-3 text-sm font-black uppercase tracking-wider text-ink transition hover:brightness-110"
                >
                  Fill Appointment
                </Link>
                {session?.role === 'hospital' ? (
                  <Link
                    to="/ambulance"
                    className="rounded-full border border-white/30 px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10"
                  >
                    Register Ambulance
                  </Link>
                ) : (
                  <Link
                    to="/hospital/register"
                    className="rounded-full border border-neon/60 px-6 py-3 text-sm font-black uppercase tracking-wider text-neon transition hover:bg-neon/10"
                  >
                    Register Hospital / Clinic
                  </Link>
                )}
              </div>
            </div>

            <div className="animate-float rounded-3xl border border-white/15 bg-[#0f1a33]/90 p-4 shadow-2xl shadow-black/25 sm:p-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Live Overview</p>
                  <span className="rounded-full bg-emerald-300/20 px-2 py-1 text-[10px] font-bold text-emerald-200">Online</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] text-slate-300">Today Appointments</p>
                    <p className="mt-1 text-2xl font-black">{platformStats.todayAppointments}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] text-slate-300">Active Doctors</p>
                    <p className="mt-1 text-2xl font-black">{platformStats.approvedDoctors}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] text-slate-300">Approved Hospitals</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{platformStats.approvedHospitals}</p>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] text-slate-300">Recent Booking</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {platformStats.recentBooking
                      ? `${platformStats.recentBooking.patientName} • ${platformStats.recentBooking.doctorSpecialization} • ${platformStats.recentBooking.appointmentTime}`
                      : 'No recent booking yet'}
                  </p>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] text-slate-300">Website Visitors</p>
                  <p className="mt-1 text-2xl font-black">👁️ {visitorCount}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">Live Ambulance Details</h2>
              <p className="mt-2 text-sm text-slate-300">Showing all registered ambulance units with driver, location, and hospital linkage.</p>
            </div>
            {session?.role === 'hospital' ? (
              <Link to="/ambulance" className="rounded-full border border-neon/60 px-5 py-2 text-xs font-black uppercase tracking-wider text-neon transition hover:bg-neon/10">
                Open Ambulance Module
              </Link>
            ) : (
              <Link to="/login" className="rounded-full border border-white/30 px-5 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10">
                Hospital Login To Manage Ambulance
              </Link>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-slate-300">
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Driver Blood</th>
                    <th className="px-4 py-3">Hospital</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ambulances.map((item) => {
                    const hospitalName = typeof item.hospitalId === 'object' ? item.hospitalId?.name : item.hospitalId;
                    const coordinates = item?.location?.coordinates || [];

                    return (
                      <tr key={item._id} className="border-b border-white/5">
                        <td className="px-4 py-3 font-bold text-slate-100">{item.vehicleNumber}</td>
                        <td className="px-4 py-3 text-slate-200">
                          <p>{item.driverName}</p>
                          <p className="text-xs text-slate-400">{item.driverPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{item.driverBloodGroup || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">{hospitalName || 'Not mapped'}</td>
                        <td className="px-4 py-3 text-slate-300">{item.address || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {coordinates[0] ?? '-'}, {coordinates[1] ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {ambulances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-300">
                        No ambulances available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 text-center sm:mb-8">
            <h2 className="text-2xl font-black sm:text-3xl">Features That Run Your Clinic</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/10">
                <p className="text-2xl" aria-hidden="true">
                  {feature.icon}
                </p>
                <h3 className="mt-3 text-lg font-black">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <h2 className="text-2xl font-black sm:text-3xl">Who Is This For</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xl">🏥</p>
                <p className="mt-2 text-lg font-black">Clinics</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xl">🏢</p>
                <p className="mt-2 text-lg font-black">Hospitals</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xl">👨‍⚕️</p>
                <p className="mt-2 text-lg font-black">Individual Doctors</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Dashboard Preview</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-sky-300/20 bg-sky-500/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-200">Doctor Dashboard</p>
              <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-[#121c39] p-3">
                <div className="h-2 w-2/3 rounded bg-sky-200/50" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-14 rounded bg-white/10" />
                  <div className="h-14 rounded bg-white/10" />
                </div>
                <div className="h-20 rounded bg-white/10" />
              </div>
            </article>

            <article className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Admin Analytics</p>
              <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-[#132235] p-3">
                <div className="h-2 w-1/2 rounded bg-emerald-200/50" />
                <div className="grid grid-cols-4 gap-2">
                  <div className="h-12 rounded bg-white/10" />
                  <div className="h-12 rounded bg-white/10" />
                  <div className="h-12 rounded bg-white/10" />
                  <div className="h-12 rounded bg-white/10" />
                </div>
                <div className="h-20 rounded bg-white/10" />
              </div>
            </article>

            <article className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-200">Patient Booking UI</p>
              <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-[#24173a] p-3">
                <div className="h-2 w-2/5 rounded bg-fuchsia-200/50" />
                <div className="h-10 rounded bg-white/10" />
                <div className="h-10 rounded bg-white/10" />
                <div className="h-10 rounded bg-white/10" />
              </div>
            </article>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Testimonials</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              "We cut appointment confusion by almost half in the first month. The workflow is smooth for reception and doctors."
            </blockquote>
            <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              "Prescription tracking is now centralized. No more missing notes between patient visits."
            </blockquote>
            <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              "The dashboard gives us a clear daily picture. We make quicker staffing decisions now."
            </blockquote>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Pricing</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-6 ${
                  plan.featured ? 'border-neon/60 bg-neon/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <h3 className="text-xl font-black">{plan.name}</h3>
                <p className="mt-2 text-3xl font-black text-neon">{plan.price}</p>
                <p className="mt-2 text-sm text-slate-300">{plan.note}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  {plan.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 lg:px-8">
          <div className="rounded-3xl border border-neon/40 bg-gradient-to-r from-neon/25 via-teal-300/15 to-blue-300/15 p-6 text-center sm:p-10">
            <h2 className="text-2xl font-black text-white sm:text-4xl">Start Managing Your Clinic Today</h2>
            <p className="mt-3 text-sm text-slate-100 sm:text-base">Bring your appointments, patients, doctors, and prescriptions into one reliable system.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-wider text-ink transition hover:brightness-95"
              >
                Start Free Trial
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-white/50 px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-white/10"
              >
                Book Demo
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
