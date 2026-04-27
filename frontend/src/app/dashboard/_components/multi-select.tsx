"use client";

import { useState, useRef, useEffect } from "react";
import { IconSearch } from "../dashboard-icons";

interface Option {
  id: string | number;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  placeholder?: string;
  icon?: any;
}

export function MultiSelect({ options, selected, onChange, placeholder = "Select options...", icon: Icon }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) && 
    !selected.includes(opt.id)
  );

  const selectedOptions = options.filter(opt => selected.includes(opt.id));

  const toggleOption = (id: string | number) => {
    if (selected.includes(id)) {
      onChange(selected.filter(item => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const removeOption = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== id));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex min-h-[44px] w-full flex-wrap gap-2 rounded-lg border border-grayborde bg-card-bg px-3 py-2 text-sm transition-all focus-within:border-primary dark:focus-within:border-emerald-500 focus-within:ring-[3px] focus-within:ring-primary/10 shadow-sm cursor-pointer ${isOpen ? "border-primary dark:border-emerald-500 ring-[3px] ring-primary/10" : ""}`}
      >
        <div className="flex items-center gap-2">
           {Icon && <Icon className="size-4.5 text-text-dim" />}
        </div>
        
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {selectedOptions.map(opt => (
              <span 
                key={opt.id} 
                className="inline-flex items-center gap-1 rounded-md bg-primary dark:bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-primary/90 dark:hover:bg-emerald-700"
              >
                {opt.label}
                <button 
                  onClick={(e) => removeOption(e, opt.id)}
                  className="rounded-full hover:bg-white/20 p-0.5"
                >
                  <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="flex items-center pl-1 text-text-dim font-medium">
            {placeholder}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-hidden rounded-xl border border-grayborde bg-card-bg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="sticky top-0 border-b border-grayborde bg-bg-soft/50 p-2 backdrop-blur-sm">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-dim" />
              <input 
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-grayborde bg-card-bg py-2 pl-9 pr-4 text-xs font-semibold text-text-main outline-none focus:border-primary dark:focus:border-emerald-500 transition-all"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto p-1 scrollbar-none">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    toggleOption(opt.id);
                    setSearch("");
                  }}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-bold text-text-main transition-colors hover:bg-bg-soft hover:text-primary dark:hover:text-emerald-500 cursor-pointer group"
                >
                  {opt.label}
                  <div className="size-4 rounded border border-grayborde bg-bg-soft group-hover:border-primary/30 dark:group-hover:border-emerald-500/30 group-hover:bg-primary/5 dark:group-hover:bg-emerald-500/10 transition-all" />
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs font-bold text-text-dim italic">
                {search ? "No matches found" : "No more options available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
