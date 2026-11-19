import type { Metadata } from "next";
import { ProfileForm } from "@/components/forms/profile-form";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

export const metadata: Metadata = {
  title: "Profile settings",
  description: "Update your PizzaHub profile details.",
};

export default function ProfileSettingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Navbar />
      <main
        id="main-content"
        className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14"
      >
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
            Your account
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-brown sm:text-4xl">
            Profile settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-brown/60">
            Keep your contact details and kitchen identity up to date. Your role
            cannot be changed after onboarding.
          </p>
        </div>
        <ProfileForm />
      </main>
      <Footer />
    </div>
  );
}
