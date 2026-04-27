"use client";

import { PermissionGuard } from "../../_components/permission-guard";
import { UserForm } from "../../_components/forms/user-form";

export default function CreateUserPage() {
  return (
    <PermissionGuard resource="users" action="can_create">
      <div className="w-full pb-20">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang uppercase">បង្កើតអ្នកប្រើប្រាស់ថ្មី</h1>
        </div>

        <UserForm />
      </div>
    </PermissionGuard>
  );
}
