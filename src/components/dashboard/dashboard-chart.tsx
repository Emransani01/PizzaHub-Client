import { DashboardPanel } from "@/components/dashboard/dashboard-panel";

interface DashboardChartProps {
  series: { date: string; count: number }[];
  title?: string;
  description?: string;
}

function dayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(parsed);
}

export function DashboardChart({
  series,
  title = "Orders · last 7 days",
  description = "New orders received across your account.",
}: DashboardChartProps) {
  const max = Math.max(1, ...series.map((point) => point.count));
  const total = series.reduce((sum, point) => sum + point.count, 0);

  return (
    <DashboardPanel
      title={title}
      description={description}
      bodyClassName="pt-2"
    >
      <div
        className="flex h-44 items-end gap-1.5 border-b border-brand-brown/10 pb-1 sm:gap-2"
        role="img"
        aria-label={`Order volume for the last seven days. ${total} order${total === 1 ? "" : "s"} total.`}
      >
        {series.length === 0 ? (
          <p className="self-center text-sm text-brand-brown/45">No data yet.</p>
        ) : (
          series.map((point) => {
            const height = Math.round((point.count / max) * 100);
            const summary = `${point.date}: ${point.count} order${point.count === 1 ? "" : "s"}`;

            return (
              <div
                key={point.date}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="text-[11px] font-bold text-brand-brown/50 tabular-nums">
                  {point.count}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-red to-brand-orange ring-1 ring-inset ring-brand-red/10"
                  style={{ height: `${Math.max(4, height)}%` }}
                  title={summary}
                />
                <span className="truncate text-[10px] font-bold uppercase tracking-wide text-brand-brown/40">
                  {dayLabel(point.date)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </DashboardPanel>
  );
}
