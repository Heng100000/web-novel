"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { IconChevronDown, IconPen, IconSearch } from "../dashboard-icons";
import { formatImageUrl } from "@/lib/utils";

interface Author {
  id: number;
  name: string;
  name_km?: string;
  photo_url?: string;
}

interface AuthorGridPickerProps {
  authors: Author[];
  value: number | string;
  onChange: (id: number) => void;
  placeholder?: string;
}

export function AuthorGridPicker({ authors, value, onChange, placeholder = "ជ្រើសរើសអ្នកនិពន្ធ" }: AuthorGridPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedAuthor = authors.find(a => a.id === Number(value));

  const filteredAuthors = authors.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    (a.name_km && a.name_km.includes(search))
  );

  const handleSelect = (author: Author) => {
    onChange(author.id);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-input-bg px-4 py-2.5 text-sm font-medium transition-all outline-none shadow-sm
          ${isOpen 
            ? "border-primary dark:border-emerald-500 ring-[3px] ring-primary/10 dark:ring-emerald-500/10" 
            : "border-grayborde hover:border-gray-300 dark:hover:border-zinc-700 focus:border-primary dark:focus:border-emerald-500 focus:ring-[3px] focus:ring-primary/10 dark:focus:ring-emerald-500/10"
          }`}
      >
        <div className="flex items-center gap-3">
          {selectedAuthor ? (
            <>
              <div className="size-6 rounded-full overflow-hidden border border-grayborde">
                <img 
                  src={selectedAuthor.photo_url ? formatImageUrl(selectedAuthor.photo_url) : "/images/placeholder-user.png"} 
                  alt="" 
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-text-main font-bold truncate max-w-[150px]">
                {selectedAuthor.name_km || selectedAuthor.name}
              </span>
            </>
          ) : (
            <span className="text-text-dim/60 font-battambang">{placeholder}</span>
          )}
        </div>
        <IconChevronDown className="size-4 text-text-dim/50" />
      </button>

      {/* Grid Selection Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="ជ្រើសរើសអ្នកនិពន្ធ"
      >
        <div className="flex flex-col gap-6">
          {/* Search Header */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/50 group-focus-within:text-primary transition-colors">
              <IconSearch className="size-4.5" />
            </div>
            <input 
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះអ្នកនិពន្ធ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-input-bg border border-grayborde rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm font-bold transition-all"
            />
          </div>

          {/* Grid Content */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
            {filteredAuthors.map((author) => (
              <button
                key={author.id}
                type="button"
                onClick={() => handleSelect(author)}
                className={`group flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                  Number(value) === author.id
                    ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                    : "border-grayborde/40 hover:border-primary/30 hover:bg-bg-soft"
                }`}
              >
                <div className="relative">
                  <div className={`size-20 rounded-full overflow-hidden border-2 transition-transform duration-300 group-hover:scale-110 shadow-md ${
                    Number(value) === author.id ? "border-primary" : "border-white dark:border-zinc-800"
                  }`}>
                    <img 
                      src={author.photo_url ? formatImageUrl(author.photo_url) : "/images/placeholder-user.png"} 
                      alt={author.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {Number(value) === author.id && (
                    <div className="absolute -bottom-1 -right-1 size-6 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white dark:border-zinc-900 shadow-sm animate-in zoom-in duration-300">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-center gap-0.5 overflow-hidden w-full text-center">
                  <span className={`text-[13px] font-black truncate w-full ${
                    Number(value) === author.id ? "text-primary" : "text-text-main"
                  }`}>
                    {author.name_km || author.name}
                  </span>
                  <span className="text-[10px] font-bold text-text-dim/60 uppercase tracking-widest truncate w-full">
                    {author.name}
                  </span>
                </div>
              </button>
            ))}

            {filteredAuthors.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-text-dim">
                <IconPen className="size-10 mb-4 opacity-20" />
                <p className="text-sm font-bold font-battambang">រកមិនឃើញអ្នកនិពន្ធ</p>
                <p className="text-[11px] font-medium mt-1">សូមសាកល្បងស្វែងរកឈ្មោះផ្សេងទៀត</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
