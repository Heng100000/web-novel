"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconBooks } from "@/app/dashboard/dashboard-icons";

export default function HeroSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="relative min-h-[80dvh] w-full overflow-hidden bg-zinc-900 lg:min-h-screen">
      {/* Magical Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="animate-float absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/20 blur-[100px]" />
        <div className="animate-float-delayed absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />

        {/* Twinkling Stars */}
        {isMounted && [...Array(30)].map((_, i) => (
          <div
            key={`hero-star-${i}`}
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

        {/* Floating Books */}
        {isMounted && [...Array(8)].map((_, i) => (
          <IconBooks
            key={`hero-book-${i}`}
            className="animate-magical-float absolute text-primary/10 blur-[0.5px]"
            style={{
              top: `${10 + Math.random() * 80}%`,
              left: `${5 + Math.random() * 90}%`,
              width: `${40 + Math.random() * 60}px`,
              height: `${40 + Math.random() * 60}px`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${20 + Math.random() * 15}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        ))}

        {/* Diagonal Glow Transition */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-indigo-500/10 pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="container relative z-10 mx-auto flex min-h-[80dvh] flex-col items-center justify-center px-4 text-center lg:min-h-screen">
        <div className="flex max-w-4xl flex-col gap-6 sm:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex flex-col gap-2">
             <span className="text-xs font-black uppercase text-primary sm:text-sm">ស្វាគមន៍មកកាន់ពិភពនៃសៀវភៅ</span>
             <h1 className="text-4xl font-black leading-[1.1] text-white sm:text-6xl lg:text-8xl">
                អានឱ្យកាន់តែច្រើន <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-primary">យល់ឱ្យកាន់តែច្បាស់</span>
             </h1>
          </div>
          
          <p className="mx-auto max-w-2xl text-base font-bold leading-relaxed text-zinc-400 sm:text-xl">
             ស្វែងយល់ពីបណ្តុំសៀវភៅ និងប្រលោមលោកដ៏សម្បូរបែបដែលនឹងផ្លាស់ប្តូរទស្សនវិស័យរបស់អ្នក។ 
             ចាប់ផ្តើមដំណើរការអានដ៏អស្ចារ្យរបស់អ្នកជាមួយយើងនៅថ្ងៃនេះ។
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
             <Link 
                href="/books" 
                className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-primary px-8 text-sm font-black text-white transition-all hover:bg-primary/90 active:scale-95 sm:w-auto sm:text-base"
             >
                ស្វែងរកសៀវភៅឥឡូវនេះ
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
             </Link>
             <Link 
                href="/authors" 
                className="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-zinc-700 bg-transparent px-8 text-sm font-black text-white transition-all hover:bg-zinc-800 hover:border-zinc-600 active:scale-95 sm:w-auto sm:text-base"
             >
                ជួបជាមួយអ្នកនិពន្ធ
             </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-zinc-500 opacity-50">
           <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase">អូសចុះក្រោម</span>
              <div className="h-10 w-px bg-gradient-to-b from-zinc-500 to-transparent" />
           </div>
        </div>
      </div>
    </section>
  );
}
