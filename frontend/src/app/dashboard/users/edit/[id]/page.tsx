"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PermissionGuard } from "../../../_components/permission-guard";
import { UserForm } from "../../../_components/forms/user-form";
import { apiClient } from "@/lib/api-client";

export default function EditUserPage() {
  const { id } = useParams();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiClient<any>(`/users/${id}/`);
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-text-main">មិនអាចរកឃើញអ្នកប្រើប្រាស់</h2>
        <p className="text-text-dim/60 mt-1">លោអ្នកប្រហែលជាបានលុប ឬបញ្ចូលលេខសម្គាល់ខុស។</p>
      </div>
    );
  }

  return (
    <PermissionGuard resource="users" action="can_edit">
      <div className="w-full pb-20">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang uppercase">កែសម្រួលអ្នកប្រើប្រាស់</h1>
        </div>

        <UserForm initialData={userData} isEdit={true} />
      </div>
    </PermissionGuard>
  );
}
