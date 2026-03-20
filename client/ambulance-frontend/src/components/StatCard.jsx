const toneClassMap = {
  cyan: "from-cyan-400/35 to-cyan-400/0 text-cyan-100 border-cyan-300/20",
  emerald: "from-emerald-400/35 to-emerald-400/0 text-emerald-100 border-emerald-300/20",
  amber: "from-amber-400/35 to-amber-400/0 text-amber-100 border-amber-300/20",
  rose: "from-rose-400/35 to-rose-400/0 text-rose-100 border-rose-300/20",
};

export function StatCard({ title, value, tone = "cyan" }) {
  const toneClass = toneClassMap[tone] || toneClassMap.cyan;

  return (
    <article className={`rounded-2xl border bg-gradient-to-br p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.24em]">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </article>
  );
}
