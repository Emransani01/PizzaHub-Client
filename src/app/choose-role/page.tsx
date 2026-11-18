import type { Metadata } from "next";
import { AuthShell } from "@/components/forms/auth-shell";
import { ChooseRoleForm } from "@/components/forms/choose-role-form";

export const metadata: Metadata = {
  title: "Choose your account type",
  description: "Pick whether you are joining PizzaHub as a customer or a vendor.",
};

export default function ChooseRolePage() {
  return (
    <AuthShell>
      <ChooseRoleForm />
    </AuthShell>
  );
}
