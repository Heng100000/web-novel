"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconShield } from "../dashboard-icons";

interface PermissionGuardProps {
  resource: string;
  action?: 'can_view' | 'can_create' | 'can_edit' | 'can_delete';
  children: React.ReactNode;
}

export function PermissionGuard({ resource, action = 'can_view', children }: PermissionGuardProps) {
  // TEMPORARILY DISABLED: Always show content
  return <>{children}</>;
}
