"use client";

import { useState, useEffect } from "react";
import { RegisterForm } from "./register-form";
import { IconBooks } from "../dashboard/dashboard-icons";

export default function RegisterClient() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex min-h-dvh w-full bg-card-bg animate-in fade-in duration-1000">
      {/* ផ្នែកខាងឆ្វេង៖ មាតិកា និងរចនាបថវេទមន្ត */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-zinc-900 px-12 lg:flex animate-in fade-in slide-in-from-left duration-1000">
        {/* ធាតុលម្អផ្ទៃខាងក្រោយ */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="animate-float absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#3b6016]/20 blur-[80px] lg:h-96 lg:w-96 lg:blur-[100px]" />
          <div className="animate-float-delayed absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#3b6016]/10 blur-[80px] lg:h-96 lg:w-96 lg:blur-[100px]" />

          {/* ផ្កាយដែលភ្លឺផ្លេកៗ និងធ្វើចលនាអណ្តែត */}
          {isMounted && [...Array(12)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="animate-twinkle absolute rounded-full bg-white"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.5 + 0.2
              }}
            />
          ))}

          {/* សៀវភៅដែលកំពុងហោះហើរ (Magical Floating Books) */}
          {isMounted && [...Array(6)].map((_, i) => (
            <IconBooks
              key={`book-${i}`}
              className="animate-magical-float absolute text-[#3b6016]/20 blur-[1px]"
              style={{
                top: `${15 + Math.random() * 70}%`,
                left: `${10 + Math.random() * 80}%`,
                width: `${30 + Math.random() * 40}px`,
                height: `${30 + Math.random() * 40}px`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${20 + Math.random() * 15}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
          
          {/* បន្ថែមពន្លឺតូចៗសម្រាប់ភាពទាក់ទាញ */}
          <div className="absolute top-1/4 right-1/4 h-2 w-2 rounded-full bg-[#3b6016]/40 blur-[2px] animate-pulse" />
          <div className="absolute bottom-1/3 left-1/3 h-1 w-1 rounded-full bg-[#3b6016]/30 blur-[1px] animate-pulse delay-700" />
        </div>

        <div className="relative z-10 flex w-full max-w-sm flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-black text-white leading-tight">
              បង្កើតគណនី <span className="text-[#3b6016]">ថ្មី</span>
            </h1>
            <p className="text-lg font-medium text-zinc-400">
              ចូលរួមជាមួយសហគមន៍អ្នកអាន ដើម្បីទទួលបានបទពិសោធន៍អានដ៏អស្ចារ្យ។
            </p>
          </div>
        </div>
      </div>

      {/* ផ្នែកខាងស្តាំ៖ ទម្រង់ការចុះឈ្មោះ (Register Form) */}
      <div className="flex w-full items-center justify-center px-4 py-6 lg:w-1/2 sm:px-6 lg:px-20 xl:px-32 bg-white lg:py-12 animate-in fade-in slide-in-from-right duration-1000 delay-300 fill-mode-both">
        <div className="flex w-full max-w-xl flex-col gap-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
