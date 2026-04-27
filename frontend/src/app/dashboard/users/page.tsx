"use client";

import { ResourceTable } from "../_components/resource-table";
import { IconUsers } from "../dashboard-icons";

export default function UsersPage() {
  return (
    <ResourceTable
      icon={IconUsers}
      title="បញ្ជីអ្នកប្រើប្រាស់"
      endpoint="/users/"
      addNewLabel="បន្ថែមអ្នកប្រើប្រាស់ថ្មី"
      createRoute="/dashboard/users/create"
      resourceKey="users"
      columns={[
        { 
          header: "អ្នកប្រើប្រាស់", 
          accessor: (user: any) => (
            <div className="flex items-center gap-3">
              <div className="size-10 overflow-hidden rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black shadow-sm ring-1 ring-primary/20">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-text-main font-battambang">{user.full_name || "គ្មានឈ្មោះ"}</div>
                <div className="text-[11px] font-medium text-text-dim/60 lowercase">{user.email}</div>
              </div>
            </div>
          )
        },
        { 
          header: "តួនាទី", 
          accessor: (user: any) => {
            const role = (user.role_details?.name || "Customer").toLowerCase();
            const colors: Record<string, string> = {
              admin: "bg-red-500/10 text-red-600 ring-red-500/20",
              staff: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
              customer: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
            };
            const roleLabels: Record<string, string> = {
              admin: "អ្នកគ្រប់គ្រង",
              staff: "បុគ្គលិក",
              customer: "អតិថិជន"
            };
            
            return (
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ${colors[role] || colors.customer} font-battambang`}>
                {roleLabels[role] || user.role}
              </span>
            );
          }
        },
        { 
          header: "លេខទូរស័ព្ទ", 
          accessor: (user: any) => (
             <span className="text-sm font-bold text-text-dim">{user.phone || "---"}</span>
          )
        },
        { 
          header: "កាលបរិច្ឆេទបង្កើត", 
          accessor: (user: any) => (
            <div className="flex flex-col">
               <span className="text-sm font-bold text-text-main">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('km-KH') : "---"}
              </span>
              <span className="text-[10px] text-text-dim/50 font-medium">
                ស្វ័យប្រវត្តិ
              </span>
            </div>
          )
        },
        { 
          header: "ស្ថានភាព", 
          accessor: (user: any) => (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-600 ring-1 ring-emerald-500/20 uppercase tracking-widest font-battambang">
              <span className="h-1 w-1 rounded-full bg-emerald-600" />
              សកម្ម
            </span>
          ) 
        },
      ]}
    />
  );
}
