"use client";

import { useState, useEffect } from "react";
import { apiClient, favoritesApi, getMediaUrl } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Search, SlidersHorizontal, ArrowLeft, ChevronRight, X } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import BookCard from "@/components/book-card";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/language-context";

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedStatus, setSelectedStatus] = useState("All");

  const loadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();

  // Sync with URL params
  useEffect(() => {
    const status = searchParams.get("edition_type");
    if (status) {
      setSelectedStatus(status);
    }
    const catParam = searchParams.get("category");
    if (catParam) {
      // If it's a number, parse it, otherwise use it as a slug string
      const isId = /^\d+$/.test(catParam);
      setSelectedCategory(isId ? parseInt(catParam) : catParam);
    }
  }, [searchParams]);

  // Initial Fetch
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsData, authsData] = await Promise.all([
          apiClient<any>("/categories/"),
          apiClient<any>("/authors/")
        ]);
        setCategories(Array.isArray(catsData) ? catsData : catsData.results || []);
        setAuthors(Array.isArray(authsData) ? authsData : authsData.results || []);
      } catch (e) {
        console.error("Error fetching metadata:", e);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Books with Filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (selectedCategory) params.append("category", selectedCategory.toString());
        if (selectedAuthor) params.append("author", selectedAuthor.toString());
        if (minPrice) params.append("min_price", minPrice);
        if (maxPrice) params.append("max_price", maxPrice);
        if (selectedStatus !== "All") params.append("edition_type", selectedStatus);

        const booksData = await apiClient<any>(`/books/?${params.toString()}`);
        let fetchedBooks = Array.isArray(booksData) ? booksData : booksData.results || [];
        setBooks(fetchedBooks);

        // Fetch favorite IDs if user is logged in
        if (user) {
          try {
            const favs = await favoritesApi.list();
            const favItems = Array.isArray(favs) ? favs : (favs.results || []);
            const ids = new Set<number>(favItems.map((f: any) => Number(f.book)));
            setFavoriteIds(ids);
          } catch (e) {
            console.error("Error fetching favorites:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 300);
    setVisibleCount(6); // Reset on filter change
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedAuthor, minPrice, maxPrice, selectedStatus, user]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedAuthor(null);
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
    setSelectedStatus("All");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header & Search Section */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="size-10 flex items-center justify-center rounded-full bg-bg-soft text-text-dim hover:bg-white hover:shadow-md transition-all active:scale-95"
                >
                  <ArrowLeft className="size-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-black text-[#3b6016] tracking-tight">{t("all_books")}</h1>
                  <p className="text-xs font-bold text-zinc-400">{t("search_desc")}</p>
                </div>
              </div>

              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden h-10 px-4 flex items-center gap-2 rounded-xl bg-bg-soft text-xs font-black text-text-dim"
              >
                <SlidersHorizontal className="size-4" />
                <span>{t("filters")}</span>
              </button>
            </div>

            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-300 group-focus-within:text-[#3b6016] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full h-12 pl-12 pr-4 rounded-2xl bg-bg-soft text-sm font-bold text-text-main outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-text-dim/30 shadow-sm"
              />
            </div>

            {/* Horizontal Authors List */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">{t("filter_by_author")}</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                  onClick={() => setSelectedAuthor(null)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedAuthor === null
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-bg-soft text-text-dim hover:bg-white"
                    }`}
                >
                  {t("all")}
                </button>
                {authors.map((author) => (
                  <button
                    key={author.id}
                    onClick={() => setSelectedAuthor(author.id)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${selectedAuthor === author.id
                        ? "bg-primary/5 border border-primary text-primary"
                        : "bg-card-bg border border-border-dim text-text-dim hover:border-text-dim/20"
                      }`}
                  >
                    <div className="size-8 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200">
                      <img src={getMediaUrl(author.photo_url)} alt="" className="size-full object-cover" />
                    </div>
                    <span className="text-xs font-black">{author.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-8 relative">
            {/* Left Sidebar Filter / Mobile Bottom Sheet */}
            <aside className={`
              fixed lg:static inset-0 z-[60] lg:z-0 transition-opacity duration-500 ease-in-out
              ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"}
            `}>
              {/* Mobile Overlay */}
              <div
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />

              <div className={`
                fixed lg:static left-0 right-0 bottom-0 lg:left-auto lg:right-auto lg:top-auto h-[85vh] lg:h-auto w-full lg:w-60 bg-white lg:bg-transparent p-6 lg:p-0 overflow-y-auto lg:overflow-visible transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl lg:shadow-none rounded-t-[32px] lg:rounded-none
                ${isSidebarOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
              `}>
                <div className="flex items-center justify-between mb-8 lg:hidden">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-black text-[#3b6016]">{t("filter_title")}</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t("filter_desc")}</p>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="size-10 flex items-center justify-center bg-zinc-100 rounded-full text-zinc-500 active:scale-90 transition-all"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Categories Section */}
                  <div className="bg-bg-soft/50 p-4 rounded-2xl border border-border-dim space-y-4">
                    <h3 className="text-sm font-black text-text-main flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary rounded-full" />
                      {t("filter_by_category")}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === null ? "bg-[#3b6016] text-white shadow-lg shadow-[#3b6016]/20" : "text-zinc-500 hover:bg-zinc-100"
                          }`}
                      >
                        <span>{t("all")}</span>
                        {selectedCategory === null && <ChevronRight className="size-3" />}
                      </button>
                      {categories.map((cat) => {
                        const isActive = selectedCategory === cat.id || selectedCategory === cat.slug;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? "bg-[#3b6016] text-white shadow-lg shadow-[#3b6016]/20" : "text-zinc-500 hover:bg-zinc-100"
                              }`}
                          >
                            <span className="line-clamp-1">{language === "km" ? (cat.name_km || cat.name) : (cat.name || cat.name_km)}</span>
                            {isActive && <ChevronRight className="size-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Publication Status Section */}
                  <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 space-y-4">
                    <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2">
                      <div className="w-1 h-4 bg-[#3b6016] rounded-full" />
                      {t("filter_by_status")}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: "All", name: t("all") },
                        { id: "Standard", name: t("standard") },
                        { id: "New Arrival", name: t("new_arrivals") },
                        { id: "Best Seller", name: t("best_sellers") },
                        { id: "Special Edition", name: t("special_edition") },
                        { id: "Limited", name: t("limited") },
                        { id: "Reprint", name: t("reprint") }
                      ].map((status) => (
                        <button
                          key={status.id}
                          onClick={() => setSelectedStatus(status.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedStatus === status.id ? "bg-[#3b6016] text-white shadow-lg shadow-[#3b6016]/20" : "text-zinc-500 hover:bg-zinc-100"
                            }`}
                        >
                          <span>{status.name}</span>
                          {selectedStatus === status.id && <ChevronRight className="size-3" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Section */}
                  <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 space-y-4">
                    <h3 className="text-sm font-black text-zinc-800 flex items-center gap-2">
                      <div className="w-1 h-4 bg-[#3b6016] rounded-full" />
                      {t("filter_by_price")}
                    </h3>
                    <div className="flex flex-col gap-6 pt-2">
                      {/* Min Price Slider */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">{t("min_price_label")}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-[#3b6016]">${minPrice || 0}</span>
                            <span className="text-[9px] font-bold text-zinc-400">{Number(minPrice || 0) * 4000} {t("riel_unit") || "៛"}</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={minPrice || 0}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#3b6016]"
                        />
                      </div>

                      {/* Max Price Slider */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">{t("max_price_label")}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-[#3b6016]">${maxPrice || 100}</span>
                            <span className="text-[9px] font-bold text-zinc-400">{Number(maxPrice || 100) * 4000} {t("riel_unit") || "៛"}</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={maxPrice || 100}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#3b6016]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clear All */}
                  <button
                    onClick={clearFilters}
                    className="w-full py-3 rounded-xl border border-dashed border-red-100 bg-red-50 text-xs font-black text-red-500 hover:bg-red-100 transition-all active:scale-95"
                  >
                    {t("clear_all_filters")}
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1">
              {loading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <Loader2 className="size-12 text-[#3b6016] animate-spin" />
                  </div>
                  <p className="text-sm font-black text-zinc-400">{t("loading_data")}</p>
                </div>
              ) : books.length > 0 ? (
                <div className="flex flex-col gap-12">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                    {books.slice(0, visibleCount).map((book) => (
                      <BookCard
                        key={book.id}
                        id={book.id}
                        title={book.title}
                        price={parseFloat(book.price)}
                        price_riel={book.price_riel}
                        discounted_price={book.discounted_price}
                        discounted_price_riel={book.discounted_price_riel}
                        discount_percentage={book.discount_percentage}
                        discount_type={book.discount_type}
                        discount_value={book.discount_value}
                        image_url={book.images?.[0]?.image_url || book.image_url}
                        author_name={book.author_name || book.author?.name}
                        edition_type={book.edition_type}
                        isInitialFavorite={favoriteIds.has(book.id)}
                      />
                    ))}
                  </div>

                  {books.length > visibleCount && (
                    <div className="flex justify-center pb-8">
                      <button
                        onClick={loadMore}
                        className="px-10 py-3 rounded-full bg-white border border-zinc-200 text-[#3b6016] font-black text-sm hover:border-[#3b6016] hover:bg-zinc-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                      >
                        <span>{t("see_more")}</span>
                        <div className="size-5 rounded-full bg-[#3b6016] text-white flex items-center justify-center text-[10px]">
                          {books.length - visibleCount}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-24 text-center flex flex-col items-center gap-4 bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-100">
                  <div className="size-16 rounded-full bg-white flex items-center justify-center shadow-sm text-zinc-200">
                    <Search className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-zinc-800">{t("no_books_found")}</h3>
                    <p className="text-xs font-bold text-zinc-400">{t("try_clearing_filters")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
