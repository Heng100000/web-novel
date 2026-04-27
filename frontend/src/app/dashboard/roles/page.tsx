"use client";

import { useState } from "react";
import { ResourceTable } from "../_components/resource-table";
import { IconShield } from "../dashboard-icons";
import { PermissionModal } from "../_components/permission-modal";

export default function RolesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  const handleRowClick = (role: any) => {
    setSelectedRole(role);
    setIsPermissionModalOpen(true);
  };

  const handleSavePermissions = (permissions: any[]) => {
    // Force the ResourceTable to re-fetch data
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <ResourceTable
        key={refreshKey}
        icon={IconShield}
        title="តួនាទី និងសិទ្ធិ"
        endpoint="/roles/"
        addNewLabel="បន្ថែមតួនាទីថ្មី"
        createRoute="/dashboard/roles/create"
        resourceKey="roles"
        onRowClick={handleRowClick}
        columns={[
          { 
            header: "តួនាទី", 
            accessor: (role: any) => (
              <div className="flex flex-col gap-1 max-w-[300px]">
                <div className="font-black text-text-main font-battambang text-[15px] transition-colors group-hover:text-primary dark:group-hover:text-emerald-500">{role.name_km || role.name}</div>
                <div className="text-[11px] font-medium text-text-dim/60 leading-relaxed line-clamp-1 font-battambang">
                  {role.description}
                </div>
              </div>
            )
          },
          { 
            header: "សមាជិក", 
            accessor: (role: any) => (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(3, role.users_count))].map((_, i) => (
                    <div key={i} className="size-7 rounded-full border-2 border-card-bg bg-bg-soft ring-1 ring-black/5" />
                  ))}
                  {role.users_count > 3 && (
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-card-bg bg-primary/10 text-[10px] font-black text-primary ring-1 ring-primary/20">
                      +{role.users_count - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold text-text-dim">
                  {role.users_count} <span className="text-[10px] uppercase font-battambang">នាក់</span>
                </span>
              </div>
            )
          },
          { 
            header: "សិទ្ធិប្រើប្រាស់", 
            accessor: (role: any) => (
              <div className="flex items-center gap-2">
                 <span className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-2.5 py-1 text-[11px] font-black text-white dark:text-zinc-900 shadow-sm ring-1 ring-white/10">
                  {role.permissions_count || 0}
                </span>
                <span className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest font-battambang">សិទ្ធិសរុប</span>
              </div>
            )
          },
          { 
            header: "ស្ថានភាព", 
            accessor: (role: any) => (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-600 ring-1 ring-emerald-500/20 uppercase tracking-widest font-battambang">
                <span className="h-1 w-1 rounded-full bg-emerald-600" />
                សកម្ម
              </span>
            ) 
          },
        ]}
      />

      <PermissionModal 
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        role={selectedRole}
        onSave={handleSavePermissions}
      />
    </>
  );
}
