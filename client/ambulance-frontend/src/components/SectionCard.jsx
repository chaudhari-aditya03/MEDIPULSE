export function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/25 p-5 shadow-[0_24px_80px_-30px_rgba(34,211,238,0.35)] backdrop-blur-xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white md:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
