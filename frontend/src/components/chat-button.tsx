"use client";

import { MessageCircleMore, X, ChevronRight, MessageSquareCode } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

export default function ChatButton() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  // Don't show chat button on login, register and admin (dashboard) pages
  const excludedPrefixes = ["/login", "/register", "/dashboard", "/admin"];
  const isHiddenPage = excludedPrefixes.some(prefix => pathname?.startsWith(prefix));

  if (isHiddenPage) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-[160px] right-4 md:bottom-28 md:right-10 z-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDismissed(false); // Reset dismissal state so it shows again on next hover
      }}
    >
      <AnimatePresence>
        {isHovered && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: -16, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-full right-0 mb-4 w-72 md:w-80 overflow-hidden rounded-[2rem] bg-white/80 p-1 shadow-2xl backdrop-blur-xl border border-white/40 ring-1 ring-black/5"
            suppressHydrationWarning
          >
            <div className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#3b6016]/5 to-[#4a771c]/10 p-5">
              {/* Decorative elements */}
              <div className="absolute -right-4 -top-4 size-24 rounded-full bg-[#3b6016]/10 blur-2xl" />
              <div className="absolute -left-4 -bottom-4 size-20 rounded-full bg-blue-500/10 blur-2xl" />
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDismissed(true);
                }}
                className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 transition-all hover:bg-white hover:text-red-500 hover:rotate-90"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-start gap-4">
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="relative shrink-0"
                >
                  <div className="size-16 overflow-hidden rounded-2xl border-2 border-white shadow-lg bg-zinc-100">
                    <Image
                      src="/images/logo.png" // Using the existing logo
                      alt="Avatar"
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                </motion.div>

                <div className="flex-1 space-y-1 pr-4">
                  <h4 className="font-hanuman text-[15px] font-black text-zinc-900 leading-tight">
                    {t("chat_welcome")}
                  </h4>
                  <p className="font-khmer text-[12px] font-medium text-zinc-600 leading-relaxed">
                    {t("chat_desc")}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <Link 
                  href="https://t.me/OurNovelbookstore"
                  target="_blank"
                  className="group flex w-full items-center justify-between overflow-hidden rounded-xl bg-[#3b6016] p-1 pr-4 text-white transition-all hover:bg-[#2d4a11] hover:shadow-lg hover:shadow-[#3b6016]/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-white/20">
                      <MessageSquareCode className="size-5" />
                    </div>
                    <span className="font-hanuman text-[13px] font-bold">{t("chat_now")}</span>
                  </div>
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        whileHover={{ 
          scale: 1.15, 
          backgroundColor: "#4a771c",
          boxShadow: "0 25px 50px -12px rgba(59, 96, 22, 0.4)" 
        }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="size-12 md:size-14 rounded-full bg-[#3b6016] flex items-center justify-center text-white shadow-lg shadow-[#3b6016]/30 group relative"
      >
        <motion.div
          whileHover={{ rotate: 12, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <MessageCircleMore className="size-6 md:size-7" />
        </motion.div>
        
        {/* Unread badge indicator */}
        <span className="absolute right-0 top-0 size-3.5 rounded-full border-2 border-[#3b6016] bg-red-500" />
      </motion.button>
    </div>
  );
}
