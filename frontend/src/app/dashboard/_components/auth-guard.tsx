"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router, mounted]);

  if (!mounted || loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-soft/30 backdrop-blur-sm transition-all duration-500" suppressHydrationWarning>
        <div 
          className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg shadow-primary/10" 
          suppressHydrationWarning
        />
      </div>
    );
  }

  return <>{children}</>;
}
