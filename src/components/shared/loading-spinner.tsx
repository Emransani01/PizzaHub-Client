import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  className,
  label = "Loading",
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
