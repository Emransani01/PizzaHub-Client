import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { SignUpForm } from "@/components/forms/sign-up-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join PizzaHub as a customer or a vendor.",
};

export default function SignUpPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="h-[560px] animate-pulse rounded-[1.5rem] bg-brand-brown/10" />
        }
      >
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
