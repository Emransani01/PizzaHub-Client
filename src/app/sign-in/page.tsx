import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { SignInForm } from "@/components/forms/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your PizzaHub account.",
};

export default function SignInPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="h-[420px] animate-pulse rounded-[1.5rem] bg-brand-brown/10" />
        }
      >
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
