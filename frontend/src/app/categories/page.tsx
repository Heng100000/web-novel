"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { Loader2, LayoutGrid, ChevronRight } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiClient<any>("/categories/");
        setCategories(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-[#3b6016] mb-2 font-khmer">ប្រភេទផលិតផល</h1>
        <p className="text-zinc-500 font-bold font-khmer">ជ្រើសរើសប្រភេទសៀវភៅដែលអ្នកចូលចិត្តអាន</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="size-10 text-[#3b6016] animate-spin" />
          <p className="font-bold text-zinc-400 font-khmer">កំពុងទាញយកទិន្នន័យ...</p>
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/books?category=${category.id}`}
              className="group bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl hover:border-[#3b6016]/20 transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-[#3b6016]/5 flex items-center justify-center text-[#3b6016] group-hover:bg-[#3b6016] group-hover:text-white transition-colors">
                  <LayoutGrid className="size-6" />
                </div>
                <div>
                  <h3 className="text-[18px] font-black text-zinc-800 group-hover:text-[#3b6016] transition-colors font-khmer">
                    {category.name_km || category.name}
                  </h3>
                  <p className="text-zinc-400 font-bold text-[12px] font-khmer">
                    {category.books_count || 0} សៀវភៅ
                  </p>
                </div>
              </div>
              <ChevronRight className="size-5 text-zinc-300 group-hover:text-[#3b6016] group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
          <p className="text-zinc-400 font-bold font-khmer">មិនទាន់មានប្រភេទផលិតផលនៅឡើយទេ</p>
        </div>
      )}
    </div>
  );
}
