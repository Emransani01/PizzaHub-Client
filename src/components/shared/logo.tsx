import Link from "next/link";
import { Pizza } from "lucide-react";
import { APP_NAME, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  tone?: "default" | "light";
}

export function Logo({ className, tone = "default" }: LogoProps) {
  return (
    <Link
      href={ROUTES.home}
      aria-label={`${APP_NAME} home`}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold",
        className,
      )}
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-red shadow-[0_6px_18px_-6px_rgba(193,18,31,0.75)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <Pizza
          aria-hidden="true"
          className="size-6 -rotate-12 text-brand-gold"
          strokeWidth={1.9}
        />
        <span className="absolute -top-0.5 right-0 size-2.5 rounded-full bg-brand-gold" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.35rem] font-extrabold tracking-tight",
            tone === "light" ? "text-cream" : "text-brand-brown",
          )}
        >
          Pizza<span className={tone === "light" ? "text-brand-gold" : "text-brand-red"}>Hub</span>
        </span>
        <span
          className={cn(
            "mt-1.5 text-[9px] font-bold uppercase tracking-[0.3em]",
            tone === "light" ? "text-cream/50" : "text-brand-brown/45",
          )}
        >
          Fresh &amp; Fast
        </span>
      </span>
    </Link>
  );
}
