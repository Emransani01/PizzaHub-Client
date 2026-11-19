"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="pizzahub-theme"
    >
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ duration: 4200 }}
          />
        </AuthProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
