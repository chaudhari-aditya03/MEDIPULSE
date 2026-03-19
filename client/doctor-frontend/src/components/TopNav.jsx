import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../lib/auth';
import { apiFetch } from '../lib/api';

function TopNav() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = async () => {
    try {
      if (session?.token) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          token: session.token,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthSession();
      setMobileOpen(false);
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="text-lg font-black uppercase tracking-[0.2em] text-white sm:text-xl">
          MediPulse
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-200 md:hidden"
        >
          Menu
        </button>

        <nav className="hidden items-center gap-2 md:flex md:gap-3">
          <NavLink to="/" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
            Home
          </NavLink>
          {!session && (
            <>
              <NavLink to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                Login
              </NavLink>
              <NavLink to="/register" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">
                Register
              </NavLink>
              <NavLink to="/hospital/register" className="rounded-full border border-neon/60 px-4 py-2 text-sm font-bold text-neon">
                Register Hospital
              </NavLink>
            </>
          )}
          {session?.role === 'doctor' && (
            <NavLink to="/doctor/dashboard" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Doctor Dashboard
            </NavLink>
          )}
          {session?.role === 'doctor' && (
            <NavLink to="/doctor/profile" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Doctor Profile
            </NavLink>
          )}
          {session?.role === 'patient' && (
            <NavLink to="/patient/dashboard" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Patient Dashboard
            </NavLink>
          )}
          {session?.role === 'patient' && (
            <NavLink to="/patient/profile" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              My Profile
            </NavLink>
          )}
          {session?.role === 'hospital' && (
            <NavLink to="/hospital/dashboard" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Hospital Dashboard
            </NavLink>
          )}
          {session && (
            <button onClick={onLogout} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/60">
              Logout
            </button>
          )}
        </nav>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0d1324] px-4 py-3 md:hidden">
          <nav className="grid gap-2">
            <NavLink to="/" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Home
            </NavLink>
            {!session && (
              <>
                <NavLink to="/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                  Login
                </NavLink>
                <NavLink to="/register" onClick={() => setMobileOpen(false)} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-ink">
                  Register
                </NavLink>
                <NavLink to="/hospital/register" onClick={() => setMobileOpen(false)} className="rounded-lg border border-neon/60 px-3 py-2 text-sm font-bold text-neon">
                  Register Hospital
                </NavLink>
              </>
            )}
            {session?.role === 'doctor' && (
              <NavLink to="/doctor/dashboard" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                Doctor Dashboard
              </NavLink>
            )}
            {session?.role === 'doctor' && (
              <NavLink to="/doctor/profile" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                Doctor Profile
              </NavLink>
            )}
            {session?.role === 'patient' && (
              <NavLink to="/patient/dashboard" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                Patient Dashboard
              </NavLink>
            )}
            {session?.role === 'patient' && (
              <NavLink to="/patient/profile" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                My Profile
              </NavLink>
            )}
            {session?.role === 'hospital' && (
              <NavLink to="/hospital/dashboard" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
                Hospital Dashboard
              </NavLink>
            )}
            {session && (
              <button onClick={onLogout} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/60">
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default TopNav;
