"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  IconMail, 
  IconHash, 
  IconEye, 
  IconEyeOff, 
  IconUser,
  IconArrowRight,
  IconLoader
} from "../dashboard/dashboard-icons";
import { apiClient } from "@/lib/api-client";

function RegisterLogo() {
  return (
    <div className="relative mx-auto h-14 w-[min(100%,180px)] shrink-0 sm:h-24 lg:h-20">
      <Image
        src="/images/logo_full.png"
        alt="Book novel"
        fill
        className="object-contain object-center drop-shadow-sm"
        sizes="280px"
        priority
      />
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.password_confirm) {
      setError("លេខសម្ងាត់មិនត្រូវគ្នាទេ។");
      setLoading(false);
      return;
    }

    try {
      await apiClient("/auth/register/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      // Registration successful, redirect to login
      router.push("/login?registered=true");
    } catch (err: any) {
      console.error("Registration error:", err);
      const errorData = err.response?.data;
      if (errorData) {
        // Handle specific field errors
        const firstError = Object.values(errorData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError("មានបញ្ហាក្នុងការចុះឈ្មោះ។ សូមព្យាយាមម្តងទៀត។");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* Header */}
      <header className="flex flex-col items-center gap-6 text-center">
        <RegisterLogo />
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-xl font-black tracking-tight text-[#3b6016] sm:text-3xl lg:text-4xl">
            ចុះឈ្មោះ
          </h1>
          <div className="h-1 w-12 rounded-full bg-[#3b6016]/20 mx-auto sm:h-1.5 sm:w-16" />
        </div>
        <p className="text-sm font-bold text-zinc-500 sm:text-base max-w-[280px]">សូមបំពេញព័ត៌មានខាងក្រោមដើម្បីបង្កើតគណនី</p>
      </header>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Full Name Field */}
          <div className="flex flex-col gap-1.5 sm:gap-2.5">
            <label htmlFor="full_name" className="text-xs font-black text-zinc-700 px-1 uppercase tracking-wider sm:text-sm">
              ឈ្មោះពេញ <span className="text-red-500">*</span>
            </label>
            <div className="relative group/field">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 transition-colors group-focus-within/field:text-[#3b6016] sm:left-5">
                <IconUser className="size-5 sm:size-6" />
              </div>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="បញ្ចូលឈ្មោះពេញរបស់អ្នក"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50/50 pl-12 pr-4 py-2.5 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:font-medium placeholder:text-zinc-300 focus:border-[#3b6016] focus:bg-white focus:shadow-lg focus:shadow-[#3b6016]/5 sm:rounded-2xl sm:pl-14 sm:pr-6 sm:py-4.5 sm:text-base"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.5 sm:gap-2.5">
            <label htmlFor="email" className="text-xs font-black text-zinc-700 px-1 uppercase tracking-wider sm:text-sm">
              អាសយដ្ឋានអ៊ីមែល <span className="text-red-500">*</span>
            </label>
            <div className="relative group/field">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 transition-colors group-focus-within/field:text-[#3b6016] sm:left-5">
                <IconMail className="size-5 sm:size-6" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="បញ្ចូលអ៊ីមែលរបស់អ្នក"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50/50 pl-12 pr-4 py-2.5 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:font-medium placeholder:text-zinc-300 focus:border-[#3b6016] focus:bg-white focus:shadow-lg focus:shadow-[#3b6016]/5 sm:rounded-2xl sm:pl-14 sm:pr-6 sm:py-4.5 sm:text-base"
              />
            </div>
          </div>

          {/* Password Fields Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            {/* Password */}
            <div className="flex flex-col gap-1.5 sm:gap-2.5">
              <label htmlFor="password" className="text-xs font-black text-zinc-700 px-1 uppercase tracking-wider sm:text-sm">
                លេខសម្ងាត់ <span className="text-red-500">*</span>
              </label>
              <div className="relative group/field">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 transition-colors group-focus-within/field:text-[#3b6016] sm:left-5">
                  <IconHash className="size-5 sm:size-6" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50/50 pl-12 pr-12 py-2.5 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-[#3b6016] focus:bg-white focus:shadow-lg focus:shadow-[#3b6016]/5 sm:rounded-2xl sm:pl-14 sm:pr-14 sm:py-4.5 sm:text-base"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5 sm:gap-2.5">
              <label htmlFor="password_confirm" className="text-xs font-black text-zinc-700 px-1 uppercase tracking-wider sm:text-sm">
                បញ្ជាក់លេខសម្ងាត់ <span className="text-red-500">*</span>
              </label>
              <div className="relative group/field">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 transition-colors group-focus-within/field:text-[#3b6016] sm:left-5">
                  <IconHash className="size-5 sm:size-6" />
                </div>
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50/50 pl-12 pr-12 py-2.5 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-300 focus:border-[#3b6016] focus:bg-white focus:shadow-lg focus:shadow-[#3b6016]/5 sm:rounded-2xl sm:pl-14 sm:pr-14 sm:py-4.5 sm:text-base"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-300 transition-all hover:bg-zinc-50 hover:text-[#3b6016] sm:right-3 sm:size-11"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <IconEyeOff className="size-5 sm:size-6" /> : <IconEye className="size-5 sm:size-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-[#3b6016] text-sm font-black text-white shadow-xl shadow-[#3b6016]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 sm:h-16 sm:rounded-2xl sm:text-base"
          >
            {loading ? (
              <IconLoader className="size-6 animate-spin text-white" />
            ) : (
              <div className="flex items-center gap-3">
                បង្កើតគណនី
                <IconArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </div>
            )}
          </button>

          <p className="text-center text-xs font-bold text-zinc-400 sm:text-sm">
            មានគណនីរួចហើយ? 
            <Link href="/login" className="ml-2 text-[#3b6016] hover:underline">ចូលប្រើប្រាស់</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
