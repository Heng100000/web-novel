"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import HomeBanner from "@/components/home/home-banner";
import AuthorCircles from "@/components/home/author-circles";
import BookFeed from "@/components/home/book-feed";
import { apiClient, favoritesApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, LayoutGrid, LayoutList, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

export default function HomeClient() {
  const [books, setBooks] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [mobileCols, setMobileCols] = useState<1 | 2 | 3>(2);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);

        // Fetch standard books and dynamic best sellers in parallel
        const [booksData, bestSellersData] = await Promise.all([
          apiClient<any>(`/books/?${params.toString()}`),
          apiClient<any>("/books/best_sellers/")
        ]);

        let fetchedBooks = Array.isArray(booksData) ? booksData : booksData.results || [];
        setBestSellers(Array.isArray(bestSellersData) ? bestSellersData : []);

        if (sortBy === "price_asc") {
          fetchedBooks.sort((a: any, b: any) => (a.discounted_price || a.price) - (b.discounted_price || b.price));
        } else if (sortBy === "price_desc") {
          fetchedBooks.sort((a: any, b: any) => (b.discounted_price || b.price) - (a.discounted_price || a.price));
        } else if (sortBy === "latest") {
          fetchedBooks.sort((a: any, b: any) => b.id - a.id);
        }

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
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, sortBy, user]);

  // Group books by edition type
  const getGroupedBooks = () => {
    const groups: { title: string, books: any[], filterId?: string, isDiscount?: boolean }[] = [];

    const discountedBooks = books.filter(b =>
      (b.discount_percentage && b.discount_percentage > 0) ||
      (b.discount_value && b.discount_value > 0) ||
      (b.discounted_price && b.discounted_price < b.price)
    );
    const standards = books.filter(b => b.edition_type?.includes("Standard") || !b.edition_type);
    const newArrivals = books.filter(b => b.edition_type?.includes("New Arrival"));
    // Removed local bestSellers filtering as it's now dynamic
    const specials = books.filter(b => b.edition_type?.includes("Special Edition") || b.edition_type?.includes("Special"));
    const limiteds = books.filter(b => b.edition_type?.includes("Limited"));
    const reprints = books.filter(b => b.edition_type?.includes("Reprint"));

    if (discountedBooks.length > 0) groups.push({ title: t("on_sale_books"), books: discountedBooks, isDiscount: true });
    if (bestSellers.length > 0) groups.push({ title: t("best_seller_dynamic"), books: bestSellers, filterId: "Best Seller" });
    if (standards.length > 0) groups.push({ title: t("standard_edition"), books: standards, filterId: "Standard" });
    if (newArrivals.length > 0) groups.push({ title: t("new_arrival_section"), books: newArrivals, filterId: "New Arrival" });
    if (specials.length > 0) groups.push({ title: t("special_edition_section"), books: specials, filterId: "Special Edition" });
    if (limiteds.length > 0) groups.push({ title: t("limited_edition_section"), books: limiteds, filterId: "Limited" });
    if (reprints.length > 0) groups.push({ title: t("reprint_section"), books: reprints, filterId: "Reprint" });

    return groups;
  };

  const groupedBooks = getGroupedBooks();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-10 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {user && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3b6016] to-[#5a8c24] p-4 shadow-lg flex items-center justify-between group">
                {/* Decorative Background Circles */}
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute -left-4 -bottom-4 size-20 rounded-full bg-black/10 blur-xl" />

                <div className="flex items-center gap-4 relative">
                  <div className="size-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner ring-1 ring-white/30">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{t("total_points")}</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white tracking-tighter">{(user.reward_points || 0).toLocaleString()}</span>
                      <span className="text-xs font-bold text-white/80 font-khmer">{t("points")}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard/rewards"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest border border-white/20 transition-all active:scale-95 flex items-center gap-2 group/btn"
                >
                  {t("redeem_points")} <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}
          <HomeBanner />

          <AuthorCircles />

          {/* Main Content Area */}
          <section className="pb-10">
            <div className="flex flex-col gap-12">
              {loading ? (
                <div className="space-y-12">
                  {[1, 2].map(i => (
                    <div key={i} className="space-y-4">
                      <div className="h-8 w-48 bg-zinc-100 animate-pulse rounded-lg" />
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(j => (
                          <div key={j} className="aspect-[3/4] bg-zinc-50 animate-pulse rounded-xl" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : groupedBooks.length > 0 ? (
                groupedBooks.map((group, idx) => (
                  <div key={idx} className="flex flex-col gap-6">
                    {/* Section Header */}
                    <div className="flex items-center gap-4 mb-2">
                      <h2 className="text-lg md:text-xl font-black text-[#3b6016] font-khmer flex items-center gap-2 whitespace-nowrap">
                        {group.title}
                        <span className="text-[10px] font-bold bg-[#3b6016]/10 text-[#3b6016] px-2 py-0.5 rounded-full">
                          {group.books.length}
                        </span>
                      </h2>

                      {/* Decorative Line */}
                      <div className="h-[1px] flex-1 bg-[#3b6016]/10" />

                      {/* Mobile Grid Switcher (Only on first section or global) */}
                      {idx === 0 && (
                        <div className="flex md:hidden items-center gap-2">
                          <div className="flex items-center gap-1 bg-bg-soft p-1 rounded-lg">
                            <button onClick={() => setMobileCols(3)} className={`p-1.5 rounded-md ${mobileCols === 3 ? "bg-white shadow-sm text-primary" : "text-text-dim/40"}`}>
                              <div className="flex gap-0.5"><div className="w-1 h-3 bg-current" /><div className="w-1 h-3 bg-current" /><div className="w-1 h-3 bg-current" /></div>
                            </button>
                            <button onClick={() => setMobileCols(2)} className={`p-1.5 rounded-md ${mobileCols === 2 ? "bg-white shadow-sm text-primary" : "text-text-dim/40"}`}>
                              <div className="flex gap-0.5"><div className="w-1.5 h-3 bg-current" /><div className="w-1.5 h-3 bg-current" /></div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Book Feed for this group */}
                    <BookFeed
                      books={group.books.slice(0, 8)}
                      loading={false}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      mobileCols={mobileCols}
                      hideSearch={true}
                      favoriteIds={favoriteIds}
                    />

                    {/* See More Button */}
                    {group.books.length > 8 && (
                      <div className="flex justify-center mt-8">
                        <Link
                          href={group.isDiscount ? "/discounts" : `/books?edition_type=${encodeURIComponent(group.filterId || "")}`}
                          className="px-8 py-3 rounded-xl border border-primary/20 text-primary font-black hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2 group/btn"
                        >
                          {t("see_more")} <ArrowRight className="size-5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-lg font-black text-zinc-900">{t("no_books_found")}</h3>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>



      <BottomNav />
      <Footer />
    </div>
  );
}
