"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import HomeBanner from "@/components/home/home-banner";
import AuthorCircles from "@/components/home/author-circles";
import BookFeed from "@/components/home/book-feed";
import { apiClient } from "@/lib/api-client";
import { MessageSquare, LayoutGrid, LayoutList } from "lucide-react";

export default function HomeClient() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [mobileCols, setMobileCols] = useState<1 | 2 | 3>(2);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        
        const booksData = await apiClient<any>(`/books/?${params.toString()}`);
        let fetchedBooks = Array.isArray(booksData) ? booksData : booksData.results || [];
        
        if (sortBy === "price_asc") {
          fetchedBooks.sort((a: any, b: any) => (a.discounted_price || a.price) - (b.discounted_price || b.price));
        } else if (sortBy === "price_desc") {
          fetchedBooks.sort((a: any, b: any) => (b.discounted_price || b.price) - (a.discounted_price || a.price));
        } else if (sortBy === "latest") {
          fetchedBooks.sort((a: any, b: any) => b.id - a.id);
        }

        setBooks(fetchedBooks);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, sortBy]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-10 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomeBanner />
          
          <AuthorCircles />

          {/* Main Content Area */}
          <section className="pb-10">
            <div className="flex flex-col gap-4">
              {/* Section Header */}
              <div className="flex items-center justify-end border-b border-zinc-200 pb-4 mb-2">
                
                {/* Mobile Grid Switcher */}
                <div className="flex md:hidden items-center gap-2">
                  <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-100">
                    <button 
                      onClick={() => setMobileCols(3)}
                      className={`p-1.5 rounded-md transition-all ${mobileCols === 3 ? "bg-white shadow-sm text-[#3b6016]" : "text-zinc-400 hover:text-zinc-600"}`}
                    >
                      <div className="flex gap-0.5">
                        <div className="w-1.5 h-4 bg-current rounded-[1px]" />
                        <div className="w-1.5 h-4 bg-current rounded-[1px]" />
                        <div className="w-1.5 h-4 bg-current rounded-[1px]" />
                      </div>
                    </button>
                    <button 
                      onClick={() => setMobileCols(2)}
                      className={`p-1.5 rounded-md transition-all ${mobileCols === 2 ? "bg-white shadow-sm text-[#3b6016]" : "text-zinc-400 hover:text-zinc-600"}`}
                    >
                      <div className="flex gap-1">
                        <div className="w-2 h-4 bg-current rounded-[1px]" />
                        <div className="w-2 h-4 bg-current rounded-[1px]" />
                      </div>
                    </button>
                    <button 
                      onClick={() => setMobileCols(1)}
                      className={`p-1.5 rounded-md transition-all ${mobileCols === 1 ? "bg-white shadow-sm text-[#3b6016]" : "text-zinc-400 hover:text-zinc-600"}`}
                    >
                      <div className="flex justify-center">
                        <div className="w-4 h-4 bg-current rounded-[1px]" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Book Feed */}
              <BookFeed 
                books={books}
                loading={loading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                mobileCols={mobileCols}
              />
            </div>
          </section>
        </div>
      </main>



      <BottomNav />
      <Footer />
    </div>
  );
}
