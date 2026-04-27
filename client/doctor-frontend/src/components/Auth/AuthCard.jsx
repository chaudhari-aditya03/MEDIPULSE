function AuthCard({ title, subtitle, children, className = '', headerSlot = null }) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-md sm:p-8 ${className}`}
      aria-label={title}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-300 sm:text-base">{subtitle}</p> : null}
        </div>
        {headerSlot}
      </div>
      {children}
    </section>
  );
}

export default AuthCard;
