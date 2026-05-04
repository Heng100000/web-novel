"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronDown } from "../dashboard-icons";

interface Option {
  label: string | number;
  value: string | number;
}

interface CustomSelectProps {
  options: Option[];
  value: any; // Can be string, number, or array
  onChange: (value: any) => void;
  className?: string;
  isMulti?: boolean;
}

export function CustomSelect({ options, value, onChange, className = "", isMulti = false }: CustomSelectProps) {
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

  const handleSelect = (optionValue: string | number) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const getLabel = () => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
      if (currentValues.length === 0) return "ជ្រើសរើស...";
      const labels = options
        .filter(opt => currentValues.includes(opt.value))
        .map(opt => opt.label);
      return labels.join(", ");
    }
    const selectedOption = options.find((opt) => opt.value === value);
    return selectedOption ? selectedOption.label : "ជ្រើសរើស...";
  };

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
        <span className="truncate text-text-main font-battambang">
          {getLabel()}
        </span>
        <IconChevronDown className={`size-4 text-text-dim shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-[100] mt-1.5 overflow-hidden rounded-lg border border-grayborde bg-card-bg py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100 max-h-[300px] overflow-y-auto">
          <div className="flex flex-col">
            {options.map((option) => {
              const isSelected = isMulti 
                ? (Array.isArray(value) && value.includes(option.value))
                : value === option.value;
                
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors text-left font-battambang
                    ${isSelected 
                      ? "bg-primary/10 text-primary font-bold" 
                      : "text-text-dim hover:bg-bg-soft hover:text-text-main"
                    }`}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

