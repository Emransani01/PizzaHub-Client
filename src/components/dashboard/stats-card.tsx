interface StatsCardProps {
  label: string;
  value?: string | number;
  hint?: string;
}

export function StatsCard({ label, value = "—", hint }: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
