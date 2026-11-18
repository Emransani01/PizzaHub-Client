import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          404
        </p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or has moved.
        </p>
        <Link
          href={ROUTES.home}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
