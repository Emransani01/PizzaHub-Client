"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes resolves the active theme on the client. Rendering a neutral
  // placeholder on the first pass avoids a hydration mismatch.
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      aria-pressed={mounted ? isDark : undefined}
      title={label}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full text-brand-brown transition-colors hover:bg-brand-red/10 hover:text-brand-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
        className,
      )}
    >
      {mounted ? (
        isDark ? (
          <Sun aria-hidden="true" className="size-5" />
        ) : (
          <Moon aria-hidden="true" className="size-5" />
        )
      ) : (
        <span aria-hidden="true" className="size-5" />
      )}
    </button>
  );
}
