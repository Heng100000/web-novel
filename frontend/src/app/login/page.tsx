"use client";

import dynamic from "next/dynamic";

// Force client-side only rendering to prevent browser extensions 
// (e.g. ColorPick Eyedropper) from causing hydration mismatches
const LoginClient = dynamic(() => import("./login-client"), { 
  ssr: false,
  loading: () => <div className="min-h-dvh w-full bg-zinc-900" /> 
});

/** 
 * ទំព័រចូលប្រើប្រាស់ប្រព័ន្ធ (Login Page)
 * កែប្រែចុងក្រោយ៖ ២០២៦-០៤-១៨
 */

export default function LoginPage() {
  return <LoginClient />;
}
