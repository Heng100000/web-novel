"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { apiClient, getMediaUrl } from "@/lib/api-client";

export default function AuthorCircles() {
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const data = await apiClient<any>("/authors/");
        setAuthors(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error("Error fetching authors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthors();
  }, []);

  return (
    <section className="py-2 bg-white overflow-hidden">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-4 pt-2 px-4 scroll-smooth">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div className="size-16 md:size-20 rounded-full bg-zinc-100 animate-pulse" />
                <div className="h-3 w-12 bg-zinc-100 rounded-full animate-pulse" />
              </div>
            ))
          ) : (
            authors.map((author) => (
              <div 
                key={author.id} 
                className="group flex flex-col items-center gap-2 shrink-0 cursor-pointer"
              >
                <div className="relative size-16 md:size-20 rounded-full p-0.5 md:p-1 border-2 border-[#3b6016]/10 transition-all group-hover:border-[#3b6016] group-hover:scale-110 active:scale-95 shadow-sm">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-zinc-100">
                    <img
                      src={getMediaUrl(author.photo_url) || "/images/placeholder_author.png"}
                      alt={author.name_km || author.name || "Author"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-center text-[10px] md:text-xs font-black text-zinc-900 group-hover:text-[#3b6016] transition-colors line-clamp-1 px-1">
                  {author.name_km || author.name}
                </span>
              </div>
            ))
          )}
        </div>
    </section>
  );
}
