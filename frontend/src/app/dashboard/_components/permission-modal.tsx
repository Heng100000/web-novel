"use client";

import { useEffect, useState } from "react";
import {
  IconShield,
  IconBooks,
  IconPen,
  IconTags,
  IconEvents,
  IconOrders,
  IconUsers,
  IconCart,
} from "../dashboard-icons";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface Permission {
  resource: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: any;
  onSave: (permissions: Permission[]) => void;
}

const RESOURCES = [
  { id: "books", label: "សៀវភៅរឿង (Books)", icon: IconBooks },
  { id: "authors", label: "អ្នកនិពន្ធ (Authors)", icon: IconPen },
  { id: "categories", label: "ប្រភេទ (Categories)", icon: IconTags },
  { id: "events", label: "ព្រឹត្តិការណ៍ (Events)", icon: IconEvents },
  { id: "orders", label: "ការបញ្ជាទិញ (Orders)", icon: IconOrders },
  { id: "cart", label: "កញ្ចប់ទិញ (Cart)", icon: IconCart },
  { id: "users", label: "អ្នកប្រើប្រាស់ (Users)", icon: IconUsers },
  { id: "roles", label: "តួនាទី (Roles)", icon: IconShield },
];

const ACTIONS = [
  { id: "can_view", label: "មើល", labelEn: "View" },
  { id: "can_create", label: "បង្កើត", labelEn: "Create" },
  { id: "can_edit", label: "កែប្រែ", labelEn: "Edit" },
  { id: "can_delete", label: "លុប", labelEn: "Delete" },
];

export function PermissionModal({ isOpen, onClose, role, onSave }: PermissionModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (isOpen && role) {
      const initialPermissions = RESOURCES.map(res => {
        const existing = role.permissions?.find((p: any) => p.resource === res.id);
        return existing || {
          resource: res.id,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false
        };
      });
      setPermissions(initialPermissions);
    }
  }, [isOpen, role]);

  const togglePermission = (resourceId: string, actionId: keyof Omit<Permission, 'resource'>) => {
    setPermissions(prev => prev.map(p => {
      if (p.resource === resourceId) {
        return { ...p, [actionId]: !p[actionId] };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient(`/roles/${role.id}/update-permissions/`, {
        method: "POST",
        body: JSON.stringify({ permissions }),
      });
      
      // If we updated the current user's role, refresh the profile to sync permissions immediately
      if (user && role && user.role === role.id) {
        await refreshUser();
      }
      
      onSave(permissions);
      onClose();
    } catch (error) {
      console.error("Failed to save permissions", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-xl bg-card-bg shadow-2xl ring-1 ring-grayborde animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">

        {/* Header - Simple & Clean */}
        <div className="flex items-center justify-between border-b border-grayborde px-8 py-6">
          <div className="flex items-center gap-5">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconShield className="size-7" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-text-main font-battambang uppercase tracking-tight">កំណត់សិទ្ធិប្រើប្រាស់</h2>
              <p className="text-sm font-bold text-text-dim/60 font-battambang">
                តួនាទី: <span className="text-primary uppercase">{role?.name_km || role?.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-lg bg-bg-soft text-text-dim hover:text-text-main transition-all active:scale-90"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Matrix - Professional & Large Typography */}
        <div className="flex-1 overflow-auto p-8 scrollbar-thin">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="pb-4 text-left text-[16px] font-black uppercase tracking-widest text-text-dim/70 font-battambang pl-4">ធនធានប្រព័ន្ធ</th>
                {ACTIONS.map(action => (
                  <th key={action.id} className="pb-4 text-center text-[16px] font-black uppercase tracking-widest text-text-dim/70 font-battambang">
                    {action.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((res) => {
                const rowPerm = permissions.find(p => p.resource === res.id);
                return (
                  <tr key={res.id} className="group">
                    <td className="rounded-l-lg border-y border-l border-grayborde bg-bg-soft/20 py-4 pl-6">
                      <div className="flex items-center gap-4">
                        <res.icon className="size-5 text-text-dim" />
                        <span className="text-[16px] font-black text-text-main font-battambang">{res.label}</span>
                      </div>
                    </td>
                    {ACTIONS.map((action, i) => {
                      const isAllowed = rowPerm ? (rowPerm[action.id as keyof Omit<Permission, 'resource'>]) : false;
                      const isLast = i === ACTIONS.length - 1;
                      return (
                        <td key={action.id} className={`border-y border-grayborde bg-bg-soft/20 py-4 text-center ${isLast ? "rounded-r-lg border-r" : ""}`}>
                          <button
                            onClick={() => togglePermission(res.id, action.id as keyof Omit<Permission, 'resource'>)}
                            className={`mx-auto flex size-10 items-center justify-center rounded-lg border-2 transition-all duration-200 active:scale-95 ${isAllowed
                              ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                              : "border-grayborde bg-card-bg/50 text-transparent hover:border-text-dim/30"
                              }`}
                          >
                            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer - Unified Brand Buttons */}
        <div className="flex items-center justify-between border-t border-grayborde px-8 py-6">
          <p className="text-xs font-bold text-text-dim/60 font-battambang">
            * រាល់ការកែប្រែនឹងមានប្រសិទ្ធភាពភ្លាមៗ។
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-black text-text-dim hover:text-text-main transition-colors font-battambang uppercase tracking-widest"
            >
              បោះបង់
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary min-w-[200px]"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span className="font-battambang">កំពុងរក្សាទុក...</span>
                </div>
              ) : (
                <span className="font-battambang uppercase tracking-widest">រក្សាទុករាល់សិទ្ធិ</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
