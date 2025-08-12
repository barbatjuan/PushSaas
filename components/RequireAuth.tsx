"use client";

import React, { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/sign-in");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-600">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
}
