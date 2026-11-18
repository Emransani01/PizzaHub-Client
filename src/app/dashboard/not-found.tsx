import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">Dashboard page not found</h1>
        <p className="text-sm text-muted-foreground">
          This dashboard route does not exist.
        </p>
        <Link
          href={ROUTES.dashboardCustomer}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Customer Dashboard
        </Link>
      </div>
    </div>
  );
}
