"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PermissionGuard } from "../../../_components/permission-guard";
import { RoleForm } from "../../../_components/forms/role-form";
import { apiClient } from "@/lib/api-client";

export default function EditRolePage() {
  const { id } = useParams();
  const [roleData, setRoleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const data = await apiClient<any>(`/roles/${id}/`);
        setRoleData(data);
      } catch (err) {
        console.error("Failed to fetch role", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRole();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!roleData) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-text-main">មិនអាចរកឃើញតួនាទី</h2>
        <p className="text-text-dim/60 mt-1">លោអ្នកប្រហែលជាបានលុប ឬបញ្ចូលលេខសម្គាល់ខុស។</p>
      </div>
    );
  }

  return (
    <PermissionGuard resource="roles" action="can_edit">
      <div className="w-full pb-20">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang uppercase">កែសម្រួលតួនាទី</h1>
        </div>

        <RoleForm initialData={roleData} isEdit={true} />
      </div>
    </PermissionGuard>
  );
}
