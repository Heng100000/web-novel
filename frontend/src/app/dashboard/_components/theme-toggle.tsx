"use client";

import React from "react";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex size-10 items-center justify-center rounded-full bg-card-bg/60 backdrop-blur-md transition-all duration-500 active:scale-95 group overflow-hidden border border-border-dim shadow-sm hover:border-primary/50 dark:hover:border-emerald-500/50 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-emerald-500/5 cursor-pointer"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Sun Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={`size-5 text-amber-500 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) transform ${
          theme === "dark" ? "translate-y-12 opacity-0 rotate-[120deg] scale-50" : "translate-y-0 opacity-100 rotate-0 scale-100"
        }`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m0 13.5V21m8.961-8.961h-2.25m-13.5 0h-2.25m15.356-6.104l-1.591 1.591M6.742 17.258l-1.591 1.591M18.364 17.258l-1.591-1.591M6.742 6.742L5.151 5.151M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>

      {/* Moon Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={`absolute size-5 text-blue-400 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) transform ${
          theme === "light" ? "-translate-y-12 opacity-0 rotate-[-120deg] scale-50" : "translate-y-0 opacity-100 rotate-0 scale-100"
        }`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        />
      </svg>
    </button>
  );
}
