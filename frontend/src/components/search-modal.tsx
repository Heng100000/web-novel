"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { apiClient, getMediaUrl } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [initialBooks, setInitialBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchInitialBooks = async () => {
      try {
        const data = await apiClient<any>(`/books/?limit=8`);
        const fetchedBooks = Array.isArray(data) ? data : data.results || [];
        setInitialBooks(fetchedBooks);
      } catch (error) {
        console.error("Error fetching initial books:", error);
      }
    };
    
    if (isOpen) {
      fetchInitialBooks();
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchBooks = async () => {
      if (query.trim().length < 1) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await apiClient<any>(`/books/?search=${query}`);
        const fetchedResults = Array.isArray(data) ? data : data.results || [];
        setResults(fetchedResults.slice(0, 10)); // Limit to 10 results for modal
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchBooks, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-0 sm:pt-20 px-0 sm:px-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[80vh] border-0 sm:border border-zinc-200"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 flex flex-col gap-4 border-b border-zinc-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative flex items-center bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden group transition-all focus-within:border-[#3b6016] focus-within:ring-4 focus-within:ring-[#3b6016]/10">
                  <div className="pl-4 pr-2 text-zinc-400 group-focus-within:text-[#3b6016]">
                    <SearchIcon className="size-5" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("search_books_placeholder")}
                    className="flex-1 py-3.5 text-base font-bold text-zinc-800 outline-none placeholder:text-zinc-400 bg-transparent"
                  />
                  {query && (
                    <button 
                      onClick={() => setQuery("")}
                      className="p-2 mr-1 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <button 
                  onClick={onClose}
                  className="size-12 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-all text-zinc-600 shrink-0 active:scale-90"
                >
                  <X className="size-6" />
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-zinc-50/30">
              <div className="mb-4 flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-wider">
                  {query.trim() === "" ? t("popular_products") : t("search_results")}
                </h3>
                {query.trim() !== "" && !loading && (
                  <span className="text-[10px] font-black bg-zinc-100 px-2 py-1 rounded text-zinc-500">
                    {t("found")} {results.length} {t("results_unit")}
                  </span>
                )}
              </div>

              {(query.trim() === "" ? initialBooks : results).length > 0 ? (
                <div className="grid gap-3">
                  {(query.trim() === "" ? initialBooks : results).map((book) => (
                    <Link
                      key={book.id}
                      href={`/books/${book.id}`}
                      onClick={onClose}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-zinc-100 hover:border-[#3b6016]/30 hover:shadow-lg hover:shadow-zinc-200/50 transition-all group"
                    >
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 border border-zinc-100 group-hover:scale-105 transition-transform">
                        <img
                          src={getMediaUrl(book.images?.[0]?.image_url) || "/images/placeholder_book.png"}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <h4 className="text-[15px] font-black text-zinc-800 leading-tight line-clamp-2 group-hover:text-[#3b6016] transition-colors">
                          {book.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-[#3b6016]">
                            ${book.discounted_price || book.price}.00
                          </span>
                          {book.discount_percentage > 0 && (
                            <span className="text-[10px] font-bold text-zinc-300 line-through">
                              ${book.price}.00
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="size-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-[#3b6016] group-hover:text-white transition-all">
                        <SearchIcon className="size-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : !loading ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="size-20 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-200 mb-4 border border-zinc-50">
                    <SearchIcon className="size-10" />
                  </div>
                  <h3 className="text-lg font-black text-zinc-800">{t("no_books_found")}</h3>
                  <p className="text-sm font-bold text-zinc-400 mt-1">{t("try_another_search")}</p>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="size-10 text-[#3b6016] animate-spin" />
                  <p className="text-xs font-black text-zinc-400 animate-pulse">{t("searching")}</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 sm:block hidden">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400">
                  <span className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded shadow-sm text-zinc-600">ESC</span>
                  <span>{t("esc_to_close")}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400">
                  <span className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded shadow-sm text-zinc-600">ENTER</span>
                  <span>{t("enter_to_view")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
