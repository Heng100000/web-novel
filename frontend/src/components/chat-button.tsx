"use client";

import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";

export default function ChatButton() {
  const pathname = usePathname();
  
  // Don't show chat button on dashboard pages
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <button className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-40 flex items-center gap-2 rounded-2xl bg-[#3b6016] px-6 py-4 text-white shadow-2xl shadow-[#3b6016]/40 transition-all hover:scale-105 active:scale-95 group font-khmer">
      <MessageSquare className="size-6 transition-transform group-hover:rotate-12" />
      <span className="text-sm font-black">ឆាត?</span>
    </button>
  );
}
