"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({ 
  title = "មិនទាន់មានទិន្នន័យ", 
  message = "ទំព័រនេះកំពុងត្រូវបានរៀបចំ។ សូមត្រឡប់មកវិញនៅពេលក្រោយ។" 
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#3b6016]/10" />
          <div className="relative size-24 rounded-full bg-[#3b6016]/5 flex items-center justify-center border-4 border-[#3b6016]/10">
            <AlertCircle className="size-12 text-[#3b6016]" />
          </div>
        </div>
        
        <div className="flex flex-col gap-2 max-w-md">
          <h2 className="text-2xl font-black text-zinc-800 font-khmer">
            {title}
          </h2>
          <p className="text-zinc-500 font-bold leading-relaxed">
            {message}
          </p>
        </div>

        <Link 
          href="/"
          className="mt-4 rounded-full bg-[#3b6016] px-8 py-3 text-sm font-black text-white shadow-xl shadow-[#3b6016]/20 hover:opacity-90 active:scale-95 transition-all"
        >
          ត្រឡប់ទៅកាន់ទំព័រដើម
        </Link>
      </motion.div>
    </div>
  );
}
