"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Tag } from "lucide-react";

export default function DiscountsPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const data = await apiClient<any>("/books/?on_sale=true");
        setBooks(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error("Error fetching discounts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscounts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen">
      <div className="mb-12 flex items-center gap-4">
        <div className="size-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-500">
          <Tag className="size-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-red-500 mb-1 font-khmer">ការបញ្ចុះតម្លៃពិសេស</h1>
          <p className="text-zinc-500 font-bold font-khmer">កម្មវិធីផ្ដល់ជូនពិសេសសម្រាប់អ្នកអាន</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="size-10 text-[#3b6016] animate-spin" />
          <p className="font-bold text-zinc-400 font-khmer">កំពុងទាញយកទិន្នន័យ...</p>
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {books.map((book) => (
            <Link 
              key={book.id} 
              href={`/books/${book.id}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-100 mb-3 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <Image
                  src={book.cover_image || "/images/placeholder_character.png"}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                  -{Math.round(((book.price - book.discount_price) / book.price) * 100)}%
                </div>
              </div>
              <h3 className="text-[15px] font-black text-zinc-800 line-clamp-1 group-hover:text-[#3b6016] transition-colors font-khmer">
                {book.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[16px] font-black text-red-500">${book.discount_price}</span>
                <span className="text-[12px] font-bold text-zinc-400 line-through">${book.price}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
          <p className="text-zinc-400 font-bold font-khmer">មិនទាន់មានការបញ្ចុះតម្លៃនៅឡើយទេ</p>
        </div>
      )}
    </div>
  );
}
