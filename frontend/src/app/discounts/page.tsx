"use client";

import { useState, useEffect } from "react";
import { apiClient, getMediaUrl } from "@/lib/api-client";
import { Loader2, Tag, Percent, Sparkles, Filter, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import BottomNav from "@/components/bottom-nav";
import BookCard from "@/components/book-card";
import { useLanguage } from "@/lib/language-context";

export default function DiscountsPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAuthors, setExpandedAuthors] = useState<Record<string, boolean>>({});
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedAuthor, setSelectedAuthor] = useState<number | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [booksData, authorsData] = await Promise.all([
          apiClient<any>("/books/?on_sale=true"),
          apiClient<any>("/authors/")
        ]);

        const allBooks = Array.isArray(booksData) ? booksData : booksData.results || [];
        const allAuthors = Array.isArray(authorsData) ? authorsData : authorsData.results || [];

        // Strictly filter to only show books with 'Promotion' type (exclude Flash Sale)
        const discountedBooks = allBooks.filter((book: any) => {
          return book.event_type === "Promotion";
        });

        setBooks(discountedBooks);
        setAuthors(allAuthors);
      } catch (error) {
        console.error("Error fetching discounts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleAuthorExpansion = (authorName: string) => {
    setExpandedAuthors(prev => ({
      ...prev,
      [authorName]: !prev[authorName]
    }));
  };

  const filteredBooks = books.filter(book => {
    const matchesStatus = selectedStatus === "All" || book.edition_type?.includes(selectedStatus);
    const matchesAuthor = selectedAuthor === null || book.author === selectedAuthor;
    return matchesStatus && matchesAuthor;
  });

  const groupedBooks = filteredBooks.reduce((groups: any, book) => {
    const authorName = book.author_details?.name ||
      book.author_name ||
      (typeof book.author === 'string' ? book.author : null) ||
      "អ្នកនិពន្ធមិនស្គាល់";
    if (!groups[authorName]) {
      groups[authorName] = [];
    }
    groups[authorName].push(book);
    return groups;
  }, {});

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfdfd]">
      <Navbar />

      <main className="flex-1 pb-24 pt-20 sm:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Balanced Header Section */}
          <section className="mb-8 relative">
            <div className="relative h-32 sm:h-40 rounded-lg overflow-hidden bg-primary shadow-sm">
              {/* Subtle Gradient & Pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-hover opacity-95" />
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />

              <div className="absolute inset-0 flex items-center px-8 sm:px-10">
                <div className="flex items-center gap-5 w-full">
                  <div className="size-12 sm:size-14 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                    <Percent className="size-6 sm:size-7 text-white" />
                  </div>

                  <div className="text-left flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 font-kantumruy">
                      {t("special_discounts_title")}
                    </h1>
                    <p className="text-white/70 text-[11px] sm:text-xs font-medium font-kantumruy">
                      {t("special_offer_desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Clean Filter Control Center */}
          <section className="mb-10">
            <div className="bg-white rounded-lg border border-zinc-200 p-1 flex flex-col md:flex-row items-stretch md:items-center gap-1">
              {/* Author Selector Chip Group */}
              <div className="flex-1 flex items-center gap-2 overflow-x-auto p-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
                <button
                  onClick={() => setSelectedAuthor(null)}
                  className={`shrink-0 px-4 py-1.5 rounded text-[11px] font-bold transition-all ${selectedAuthor === null
                      ? "bg-primary text-white"
                      : "bg-transparent text-zinc-500 hover:bg-zinc-50"
                    }`}
                >
                  {t("all")}
                </button>
                {authors.map((author) => (
                  <button
                    key={author.id}
                    onClick={() => setSelectedAuthor(author.id)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded border transition-all ${selectedAuthor === author.id
                        ? "bg-primary/5 border-primary/20 text-primary"
                        : "bg-white border-transparent text-zinc-600 hover:border-zinc-200"
                      }`}
                  >
                    {author.photo_url ? (
                      <img
                        src={getMediaUrl(author.photo_url)}
                        alt={author.name}
                        className="size-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-4 rounded-full bg-zinc-100 flex items-center justify-center text-[8px] text-zinc-400 font-bold">
                        {author.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-[11px] font-bold whitespace-nowrap">{author.name}</span>
                  </button>
                ))}
              </div>

              {/* Filament-styled Status Filter Dropdown */}
              <div className="md:border-l border-zinc-100 px-3 flex items-center gap-3 min-w-[180px]">
                <div className="size-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                  <Filter className="size-3.5" />
                </div>
                <div className="relative flex-1">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-9 bg-white border border-zinc-200 rounded-lg px-3 pr-8 text-[13px] font-semibold text-zinc-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/5 appearance-none cursor-pointer"
                  >
                    <option value="All">{t("all")}</option>
                    <option value="Standard">{t("standard")}</option>
                    <option value="New Arrival">{t("new_arrivals")}</option>
                    <option value="Best Seller">{t("best_sellers")}</option>
                    <option value="Special Edition">{t("special_edition")}</option>
                    <option value="Limited">{t("limited")}</option>
                    <option value="Reprint">{t("reprint")}</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <ChevronRight className="size-3.5 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Meta */}
            <div className="mt-4 flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-zinc-100" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {filteredBooks.length} {t("matches_found")}
              </span>
              <div className="h-px flex-1 bg-zinc-100" />
            </div>
          </section>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="size-10 border-2 border-zinc-100 border-t-primary rounded-full animate-spin" />
              <p className="text-[11px] font-bold text-zinc-400 font-kantumruy">{t("loading_discounts")}</p>
            </div>
          ) : Object.keys(groupedBooks).length > 0 ? (
            <div className="space-y-16">
              {Object.entries(groupedBooks).map(([authorName, authorBooks]: [string, any]) => {
                const isExpanded = expandedAuthors[authorName];
                const displayedBooks = isExpanded ? authorBooks : authorBooks.slice(0, 8);
                const hasMore = authorBooks.length > 8;

                return (
                  <div key={authorName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Author Section Header */}
                    <div className="flex flex-col mb-8">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 font-kantumruy">{authorName}</h2>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          ({authorBooks.length})
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[10px] font-medium font-kantumruy ml-4 uppercase tracking-widest">{t("author_books_list")}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                      {displayedBooks.map((book: any) => (
                        <div key={book.id}>
                          <BookCard
                            {...book}
                            author_name={authorName}
                            title={book.title}
                            price={parseFloat(book.price)}
                            price_riel={book.price_riel}
                            discounted_price={book.discounted_price}
                            discounted_price_riel={book.discounted_price_riel}
                            image_url={book.images?.[0]?.image_url || book.image_url}
                          />
                        </div>
                      ))}
                    </div>

                    {hasMore && (
                      <div className="mt-8 flex justify-center">
                        <button
                          onClick={() => toggleAuthorExpansion(authorName)}
                          className="flex items-center gap-2 px-8 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-bold font-kantumruy hover:bg-zinc-800 transition-colors shadow-sm"
                        >
                          <span>{isExpanded ? t("show_less") : `${t("see_more")} (${authorBooks.length - 8})`}</span>
                          <ChevronRight className={`size-3.5 transition-transform ${isExpanded ? "-rotate-90" : "rotate-0"}`} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Clean & Professional Empty State */
            <div className="text-center py-24 px-6 border-2 border-dashed border-zinc-100 rounded-lg">
              <div className="size-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Tag className="size-8 text-zinc-200" />
              </div>

              <h3 className="text-lg font-bold text-zinc-800 mb-2 font-kantumruy">{t("no_discounts_yet")}</h3>
              <p className="text-zinc-400 text-[11px] font-medium font-kantumruy mb-8 max-w-xs mx-auto leading-relaxed">
                {t("discounts_empty_desc") || "កុំបារម្ភអី! យើងនឹងមានការបញ្ចុះតម្លៃថ្មីៗជូនក្នុងពេលឆាប់ៗនេះ។ សូមរង់ចាំតាមដានទាំងអស់គ្នា។"}
              </p>

              <Link href="/books" className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded text-[11px] font-bold shadow-sm hover:bg-primary-hover transition-colors font-kantumruy">
                <span>{t("all_books")}</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
      <Footer />
    </div>
  );
}
