"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronDown } from "../dashboard-icons";

interface Option {
  label: string | number;
  value: string | number;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: any) => void;
  className?: string;
}

export function CustomSelect({ options, value, onChange, className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-input-bg px-4 py-2.5 text-sm font-medium transition-all outline-none shadow-sm
          ${isOpen 
            ? "border-primary dark:border-emerald-500 ring-[3px] ring-primary/10 dark:ring-emerald-500/10" 
            : "border-grayborde hover:border-gray-300 dark:hover:border-zinc-700 focus:border-primary dark:focus:border-emerald-500 focus:ring-[3px] focus:ring-primary/10 dark:focus:ring-emerald-500/10"
          }`}
      >
        <span className={selectedOption ? "text-text-main" : "text-text-dim"}>
          {selectedOption ? selectedOption.label : "Select an option"}
        </span>
        <IconChevronDown className={`size-4 text-text-dim transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-[100] mt-1.5 overflow-hidden rounded-lg border border-grayborde bg-card-bg py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
          <div className="flex flex-col">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center px-4 py-2 text-sm transition-colors text-left
                  ${value === option.value 
                    ? "bg-bg-soft text-text-main font-semibold" 
                    : "text-text-dim hover:bg-bg-soft hover:text-text-main"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
