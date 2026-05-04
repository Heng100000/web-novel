"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { IconMail, IconHash, IconEye, IconEyeOff } from "../dashboard/dashboard-icons";

export function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function IconGoogle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" width="22" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

function IconShieldLock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 1.558.298 3.047.838 4.412a12.022 12.022 0 005.625 6.643c.96.438 1.991.666 3.037.666 1.046 0 2.077-.228 3.037-.666a12.022 12.022 0 005.625-6.643 11.99 11.99 0 00.598-3.744c0-1.32-.213-2.592-.607-3.744A11.959 11.959 0 0115 2.714" />
    </svg>
  );
}

function LoginLogo() {
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("ការចុះឈ្មោះជោគជ័យ! សូមចូលប្រើប្រាស់គណនីរបស់អ្នក។");
    }
  }, [searchParams]);
  
  // Client-side metadata management
  useEffect(() => {
    document.title = "ចូលប្រើប្រាស់ | Book Novel";
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // Account Lockout State
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Timer Effect
  useEffect(() => {
    if (!lockedUntil) return;

    const timer = setInterval(() => {
      const remaining = Math.round((lockedUntil.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setTimeLeft(0);
        setError(null);
        clearInterval(timer);
        setTimeout(() => emailInputRef.current?.focus(), 100);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockedUntil]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      try {
        const data = await apiClient<{
          access: string;
          refresh: string;
          user: any;
        }>("auth/login/", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        login(data.access, data.user);
        
        const roleName = data.user.role_details?.name?.toLowerCase() || "";
        if (roleName === 'admin' || roleName === 'staff') {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
      } catch (err: any) {
        // Handle Lockout from ApiError (403 or data.locked_until)
        const lockoutDateRaw = err.data?.locked_until;
        if (err.status === 403 || lockoutDateRaw) {
          const rawDate = Array.isArray(lockoutDateRaw) ? lockoutDateRaw[0] : lockoutDateRaw;
          if (rawDate) {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
              setLockedUntil(dateObj);
              setTimeLeft(Math.max(0, Math.round((dateObj.getTime() - Date.now()) / 1000)));
            }
          }
        }
        setError(err.message || "អ៊ីមែល ឬលេខសម្ងាត់មិនត្រឹមត្រូវ");
      }
    });
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col items-center gap-6 text-center">
        <LoginLogo />
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-xl font-black tracking-tight text-[#3b6016] sm:text-3xl lg:text-4xl">
            ចូលប្រើប្រាស់
          </h1>
          <div className="h-1 w-12 rounded-full bg-[#3b6016]/20 mx-auto sm:h-1.5 sm:w-16" />
        </div>
        
        {error && (
          <div className={`w-full rounded-2xl p-4 text-center text-sm font-bold border animate-in slide-in-from-top-2 duration-300 ${
            lockedUntil ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-600 border-red-200"
          }`}>
            <span className="flex items-center justify-center gap-2">
              <span className="size-2 rounded-full bg-current animate-pulse" />
              {error}
            </span>
          </div>
        )}

        {successMessage && (
          <div className="w-full rounded-2xl p-4 text-center text-sm font-bold border border-primary/20 bg-primary/5 text-primary animate-in slide-in-from-top-2 duration-300">
            <span className="flex items-center justify-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              {successMessage}
            </span>
          </div>
        )}
      </header>

      {/* CORE LOGIC: HARD HIDE OF INPUT FIELDS */}
      {lockedUntil ? (
        <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-amber-50/30 border border-amber-100 gap-4 animate-in zoom-in-95 duration-500 sm:p-8 sm:gap-8">
          <div className="relative flex h-40 w-40 items-center justify-center">
            {/* Background Rings */}
            <div className="absolute inset-0 rounded-full border-2 border-amber-200/50" />
            <div className="absolute inset-2 rounded-full border-4 border-amber-100 animate-pulse" />
            
            {/* Main Timer Display */}
            <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white shadow-xl shadow-amber-200/20">
               <IconShieldLock className="size-6 text-amber-500 mb-1" />
               <span className="text-3xl font-black text-amber-600 font-mono tabular-nums tracking-tighter">
                  {formatTime(timeLeft)}
               </span>
               <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-1">រង់ចាំ</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <h3 className="text-xl font-black text-amber-900">គណនីត្រូវបានចាក់សោ</h3>
            <p className="text-sm leading-relaxed text-amber-800/70 max-w-[240px]">
              ដើម្បីសុវត្ថិភាព គណនីរបស់អ្នកត្រូវបានការពារបណ្តោះអាសន្ន។ សូមព្យាយាមម្តងទៀតបន្ទាប់ពីកម្មវិធីកំណត់ម៉ោងបញ្ចប់។
            </p>
          </div>

          <button 
            type="button"
            onClick={() => { setLockedUntil(null); setError(null); }}
            className="group flex items-center gap-2 text-xs font-black text-amber-700 hover:text-amber-900 transition-colors"
          >
            <span className="h-px w-4 bg-current opacity-30 group-hover:w-8 transition-all" />
            ព្យាយាមជាមួយគណនីផ្សេង
            <span className="h-px w-4 bg-current opacity-30 group-hover:w-8 transition-all" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in duration-700 sm:gap-8">
          <div className="flex flex-col gap-3 sm:gap-6">
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
                  ref={emailInputRef}
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="បញ្ចូលអ៊ីមែលរបស់អ្នក"
                  className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50/50 pl-12 pr-4 py-2.5 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:font-medium placeholder:text-zinc-300 focus:border-[#3b6016] focus:bg-white focus:shadow-lg focus:shadow-[#3b6016]/5 sm:rounded-2xl sm:pl-14 sm:pr-6 sm:py-4.5 sm:text-base"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5 sm:gap-2.5">
              <div className="flex items-center justify-between px-1">
                <label htmlFor="password" className="text-xs font-black text-zinc-700 uppercase tracking-wider sm:text-sm">
                  លេខសម្ងាត់ <span className="text-red-500">*</span>
                </label>
                <a href="#" className="text-xs font-black text-[#3b6016] hover:underline">ភ្លេចលេខសម្ងាត់?</a>
              </div>
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

          <div className="flex items-center gap-3 px-1">
            <label className="relative flex cursor-pointer items-center group">
              <input type="checkbox" name="remember" className="peer sr-only" />
              <div className="size-6 rounded-lg border-2 border-zinc-200 transition-all peer-checked:border-[#3b6016] peer-checked:bg-[#3b6016] shadow-sm" />
              <svg className="absolute left-1 top-1 size-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="ml-3 text-sm font-bold text-zinc-600 select-none group-hover:text-[#3b6016] transition-colors">ចងចាំខ្ញុំ</span>
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={isPending}
              className="relative h-12 w-full flex items-center justify-center overflow-hidden rounded-xl bg-[#3b6016] text-base font-black text-white shadow-xl shadow-[#3b6016]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 sm:h-16 sm:rounded-2xl sm:text-lg"
            >
              {isPending ? (
                <span className="flex items-center gap-3">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent sm:size-5" />
                  កំពុងត្រួតពិនិត្យ
                </span>
              ) : (
                "ចូលក្នុងប្រព័ន្ធ"
              )}
            </button>

            <p className="text-center text-xs font-bold text-zinc-400 sm:text-sm">
              មិនទាន់មានគណនី? 
              <Link href="/register" className="ml-2 text-[#3b6016] hover:underline">ចុះឈ្មោះឥឡូវនេះ</Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
