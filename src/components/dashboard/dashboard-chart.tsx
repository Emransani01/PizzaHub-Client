interface DashboardChartProps {
  series: { date: string; count: number }[];
}

function dayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(parsed);
}

export function DashboardChart({ series }: DashboardChartProps) {
  const max = Math.max(1, ...series.map((point) => point.count));

  return (
    <div className="rounded-[1.25rem] border border-brand-brown/10 bg-white p-5 shadow-[0_16px_40px_-36px_rgba(43,26,18,0.5)]">
      <div className="space-y-1">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-brand-brown/60">
          Orders · last 7 days
        </h2>
        <p className="text-sm text-brand-brown/50">
          New orders received across your account.
        </p>
      </div>

      <div className="mt-6 flex h-44 items-end gap-2" role="img" aria-label="Order volume for the last seven days">
        {series.length === 0 ? (
          <p className="text-sm text-brand-brown/45">No data yet.</p>
        ) : (
          series.map((point) => {
            const height = Math.round((point.count / max) * 100);
            return (
              <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-brand-brown/50">
                  {point.count}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-red to-brand-orange"
                  style={{ height: `${Math.max(4, height)}%` }}
                  title={`${point.date}: ${point.count} order${point.count === 1 ? "" : "s"}`}
                />
                <span className="text-[10px] font-bold uppercase tracking-wide text-brand-brown/40">
                  {dayLabel(point.date)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
