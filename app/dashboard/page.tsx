"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Read role and redirect to role-specific dashboard page
    const role = localStorage.getItem("kurukshetra_active_role") || "authority";
    router.replace(`/dashboard/${role}`);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-red-500 mb-2" />
      <span className="text-xs font-mono">Redirecting to designated role dashboard...</span>
    </div>
  );
}
