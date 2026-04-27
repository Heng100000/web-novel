"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { 
  IconShield,
  IconPen,
  IconText
} from "../../dashboard-icons";

interface RoleFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function RoleForm({ initialData, isEdit = false }: RoleFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    name_km: "",
    description: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        name_km: initialData.name_km || "",
        description: initialData.description || ""
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isEdit) {
        await apiClient(`/roles/${initialData.id}/`, {
          method: "PATCH",
          body: JSON.stringify(formData),
        });
      } else {
        await apiClient("/roles/", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      router.push("/dashboard/roles");
      router.refresh();
    } catch (error) {
      console.error("Failed to save role", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <section className="rounded-3xl border border-border-dim bg-card-bg p-6 shadow-sm ring-1 ring-border-dim lg:p-8 transition-all">
          <div className="mb-8 flex items-center gap-3 border-b border-border-dim/50 pb-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconShield className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main font-battambang uppercase tracking-tight">
                {isEdit ? "កែសម្រួលតួនាទី" : "គ្រប់គ្រងតួនាទី"}
              </h2>
              <p className="text-xs font-medium text-text-dim font-battambang">
                {isEdit ? `កែសម្រួលព័ត៌មាន និងសិទ្ធិនៃតួនាទី ${formData.name}` : "កំណត់អត្តសញ្ញាណ និងឈ្មោះតួនាទីថ្មីសម្រាប់បុគ្គលិក"}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Name (System) */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                ឈ្មោះសម្ងាត់ (System Name) <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-colors">
                  <IconPen className="size-4.5" />
                </div>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  className="input-standard pl-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Admin, Editor, Staff..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <p className="text-[10px] font-bold text-text-dim/50 uppercase tracking-widest pl-1 italic">
                * ឈ្មោះនេះប្រើសម្រាប់កូដប្រព័ន្ធ និងមិនអាចប្តូរបានទេពេលបង្កើតរួច។
              </p>
            </div>

            {/* Name (Khmer) */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                ឈ្មោះបង្ហាញជាភាសាខ្មែរ <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-colors">
                  <IconText className="size-4.5" />
                </div>
                <input
                  type="text"
                  required
                  className="input-standard pl-12"
                  placeholder="អ្នកគ្រប់គ្រង, បុគ្គលិក..."
                  value={formData.name_km}
                  onChange={(e) => setFormData({ ...formData, name_km: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                ការពណ៌នាខ្លីៗ
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-text-dim/40 group-focus-within:text-primary transition-colors">
                  <IconText className="size-4.5" />
                </div>
                <textarea
                  rows={4}
                  className="input-standard pl-12 pt-3 min-h-[120px] resize-none"
                  placeholder="កំណត់សម្គាល់អំពីសិទ្ធិ ឬកិច្ចការនៃតួនាទីនេះ..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary min-w-[120px] font-battambang"
          >
            បោះបង់
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary min-w-[180px] font-battambang"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                កំពុងរក្សាទុក...
              </div>
            ) : isEdit ? "រក្សាទុកការកែប្រែ" : "បង្កើតតួនាទីថ្មី"}
          </button>
        </div>
      </form>
    </div>
  );
}
