import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner label="Loading dashboard" />
    </div>
  );
}
