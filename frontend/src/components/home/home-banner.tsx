"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function HomeBanner() {
  return (
    <section className="relative w-full py-1 overflow-hidden bg-white">
      <div className="relative overflow-hidden rounded-2xl bg-[#3b6016] min-h-[120px] md:min-h-[220px] shadow-2xl shadow-zinc-200/50 flex items-center">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-black/5 -skew-x-12 translate-x-20" />
          
          <div className="relative z-10 w-full flex flex-row items-center justify-between px-4 sm:px-16 lg:px-20 py-4 md:py-8 gap-2 md:gap-8">
            {/* Character Illustration - Left Side */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative size-28 sm:size-64 lg:size-80 shrink-0"
            >
              <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
              <img
                src="/images/cat.png"
                alt="Character"
                className="w-full h-full object-contain relative z-10 drop-shadow-xl md:drop-shadow-2xl"
                onError={(e: any) => {
                  e.target.src = "https://cdn-icons-png.flaticon.com/512/6840/6840478.png";
                }}
              />
            </motion.div>

            {/* Content - Right Side */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-start text-left gap-1 md:gap-4 flex-1"
            >
              <h1 className="text-sm md:text-3xl lg:text-5xl font-black leading-tight text-white">
                សូមស្វាគមន៍មកកាន់ <br />
                <span className="text-amber-200">Our Novel - ហាងលក់សៀវភៅ</span>
              </h1>
              
              <p className="text-[10px] md:text-lg font-bold text-zinc-200 line-clamp-2">
                ជម្រាបសួរ! មានអ្វីឱ្យពួកយើងជួយដែរឬទេ?
              </p>

              <div className="flex flex-wrap gap-2 md:gap-4 pt-1 md:pt-4">
                <Link 
                  href="/books"
                  className="inline-flex items-center gap-1 md:gap-2 rounded-full bg-white px-3 md:px-8 py-1.5 md:py-3 text-[10px] md:text-sm font-black text-[#3b6016] shadow-xl transition-all hover:bg-zinc-100 hover:scale-105 active:scale-95"
                >
                  ផលិតផល
                  <ArrowRight className="size-3 md:size-4" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute inset-y-0 left-2 md:left-4 flex items-center pointer-events-none">
            <button className="size-8 md:size-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50">
              <ChevronLeft className="size-4 md:size-6" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-2 md:right-4 flex items-center pointer-events-none">
            <button className="size-8 md:size-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50">
              <ChevronRight className="size-4 md:size-6" />
            </button>
          </div>
        </div>
    </section>
  );
}
