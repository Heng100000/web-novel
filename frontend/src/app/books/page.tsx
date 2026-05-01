"use client";

import { useState, useEffect } from "react";
import { apiClient, getMediaUrl } from "@/lib/api-client";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Search, Filter } from "lucide-react";

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await apiClient<any>("/books/");
        setBooks(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#3b6016] mb-2">បញ្ជីសៀវភៅទាំងអស់</h1>
          <p className="text-zinc-500 font-bold">ស្វែងរកសៀវភៅដែលអ្នកចូលចិត្ត</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="ស្វែងរក..." 
              className="pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#3b6016]/20 focus:border-[#3b6016] transition-all w-full md:w-64"
            />
          </div>
          <button className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors">
            <Filter className="size-5 text-zinc-600" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="size-10 text-[#3b6016] animate-spin" />
          <p className="font-bold text-zinc-400">កំពុងទាញយកទិន្នន័យ...</p>
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {books.map((book) => (
            <Link 
              key={book.id} 
              href={`/books/${book.id}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-100 mb-3 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <Image
                  src={getMediaUrl(book.image_url)}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
                {book.discount_price && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                    បញ្ចុះតម្លៃ
                  </div>
                )}
              </div>
              <h3 className="text-[15px] font-black text-zinc-800 line-clamp-1 group-hover:text-[#3b6016] transition-colors">
                {book.title}
              </h3>
              <p className="text-[12px] font-bold text-zinc-500 mb-1">{book.author_name}</p>
              <div className="mt-auto">
                {book.discount_price ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-black text-red-500">${book.discount_price}</span>
                    <span className="text-[12px] font-bold text-zinc-400 line-through">${book.price}</span>
                  </div>
                ) : (
                  <span className="text-[14px] font-black text-[#3b6016]">${book.price}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
          <p className="text-zinc-400 font-bold">មិនមានសៀវភៅនៅក្នុងបញ្ជីនៅឡើយទេ</p>
        </div>
      )}
    </div>
  );
}
