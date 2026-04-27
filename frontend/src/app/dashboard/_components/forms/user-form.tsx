"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { 
  IconUsers, 
  IconMail, 
  IconUser, 
  IconPhone, 
  IconMapPin, 
  IconShield,
  IconLock,
  IconChevronDown,
  IconEye,
  IconEyeOff
} from "../../dashboard-icons";

interface Role {
  id: number;
  name: string;
  name_km: string;
}

interface UserFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function UserForm({ initialData, isEdit = false }: UserFormProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    address: "",
    password: "",
    role: ""
  });

  useEffect(() => {
    // Fetch roles for selection
    const fetchRoles = async () => {
      try {
        const rolesData = await apiClient<any>("/roles/");
        setRoles(Array.isArray(rolesData) ? rolesData : rolesData.results || []);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    fetchRoles();

    if (initialData) {
      setFormData({
        email: initialData.email || "",
        full_name: initialData.full_name || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        password: "", // Don't populate password
        role: initialData.role?.toString() || ""
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isEdit) {
        // Remove password if empty during edit
        const payload = { ...formData };
        if (!payload.password) delete (payload as any).password;
        
        await apiClient(`/users/${initialData.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient("/users/", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      router.push("/dashboard/users");
      router.refresh();
    } catch (error) {
      console.error("Failed to save user", error);
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
              <IconUsers className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main font-battambang uppercase tracking-tight">
                {isEdit ? "កែសម្រួលអ្នកប្រើប្រាស់" : "គ្រប់គ្រងអ្នកប្រើប្រាស់"}
              </h2>
              <p className="text-xs font-medium text-text-dim font-battambang">
                {isEdit ? `កែសម្រួលព័ត៌មានគណនីរបស់ ${formData.email}` : "កំណត់ព័ត៌មានលម្អិត និងតួនាទីសម្រាប់អ្នកប្រើប្រាស់ថ្មី"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            {/* Email */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                អាសយដ្ឋានអ៊ីមែល <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-colors">
                  <IconMail className="size-4.5" />
                </div>
                <input
                  type="email"
                  required
                  className="input-standard pl-12"
                  placeholder="example@novel.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                ឈ្មោះពេញ <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-colors">
                  <IconUser className="size-4.5" />
                </div>
                <input
                  type="text"
                  required
                  className="input-standard pl-12"
                  placeholder="អាឡិចហ្សាន់ឌឺ"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                លេខទូរស័ព្ទ
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-colors">
                  <IconPhone className="size-4.5" />
                </div>
                <input
                  type="text"
                  className="input-standard pl-12"
                  placeholder="012 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                តួនាទីក្នុងប្រព័ន្ធ <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-colors">
                  <IconShield className="size-4.5" />
                </div>
                <select
                  required
                  className="input-standard pl-12 appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="" disabled>ជ្រើសរើសតួនាទី</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name_km} ({role.name})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim/40">
                   <IconChevronDown className="size-4" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2.5 md:col-span-2">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                {isEdit ? "ប្តូរលេខសម្ងាត់ (ទុកទំនេរបើមិនចង់ប្តូរ)" : "លេខសម្ងាត់"} {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 group-focus-within:text-primary transition-colors">
                  <IconLock className="size-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required={!isEdit}
                  className="input-standard pl-12 pr-12"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim/40 hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <IconEyeOff className="size-4.5" />
                  ) : (
                    <IconEye className="size-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2.5 md:col-span-2">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                អាសយដ្ឋាន
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-text-dim/40 group-focus-within:text-primary transition-colors">
                  <IconMapPin className="size-4.5" />
                </div>
                <textarea
                  rows={3}
                  className="input-standard pl-12 pt-3 min-h-[100px] resize-none"
                  placeholder="ភូមិ សង្កាត់ ខណ្ឌ រាជធានីភ្នំពេញ..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            ) : isEdit ? "រក្សាទុកការកែប្រែ" : "បង្កើតគណនីថ្មី"}
          </button>
        </div>
      </form>
    </div>
  );
}
