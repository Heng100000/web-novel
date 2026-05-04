"use client";

import { useState, useEffect } from "react";
import { apiClient, getMediaUrl } from "@/lib/api-client";
import { Loader2, Tag, Percent, Sparkles, ChevronRight, Clock, Flame, Zap, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import BottomNav from "@/components/bottom-nav";
import BookCard from "@/components/book-card";
import { useLanguage } from "@/lib/language-context";

export default function FlashSalePage() {
  const [books, setBooks] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const { t } = useLanguage();

  // Real countdown timer logic
  useEffect(() => {
    if (!activeEvent?.end_date) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(activeEvent.end_date) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        // AUTOMATICALLY EXPIRE: Clear books when time is up
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setBooks([]); 
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [activeEvent]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch on-sale books
        const data = await apiClient<any>("/books/?on_sale=true");
        const allBooks = Array.isArray(data) ? data : data.results || [];
        
        // Filter specifically for FlashSale type
        const flashSaleBooks = allBooks.filter((book: any) => book.event_type === "FlashSale");
        setBooks(flashSaleBooks.slice(0, 12));

        // 2. Fetch Active Events to get Banner Info
        const eventsRes = await apiClient<any>("/events/?status=Active&page_size=50");
        const allEvents = Array.isArray(eventsRes) ? eventsRes : eventsRes.results || [];
        const currentFlashSale = allEvents.find((e: any) => e.event_type === "FlashSale");
        
        if (currentFlashSale) {
          setActiveEvent(currentFlashSale);
        }
      } catch (error) {
        console.error("Error fetching flash sale:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfdfd]">
      <Navbar />

      <main className="flex-1 pb-24 pt-20 sm:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Slim & Attractive Flash Sale Header */}
          <section className="mb-6 relative">
            <div className="relative h-32 sm:h-44 rounded-2xl overflow-hidden bg-primary shadow-lg border border-primary/10">
               {/* Subtle Pattern & Gradient */}
               <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-hover opacity-95" />
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
               
               <div className="relative z-10 h-full flex items-center justify-between px-5 sm:px-12 py-4 sm:py-6 gap-4">
                  <div className="flex-1 text-left">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/15 backdrop-blur-md rounded-full border border-white/20 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider mb-2">
                      <Zap className="size-2.5 sm:size-3 text-yellow-300 fill-yellow-300" />
                      {t("happening_now")}
                    </div>
                    <h1 className="text-lg sm:text-3xl font-black text-white mb-1 tracking-tight font-battambang uppercase">
                      {activeEvent?.title || "Flash Sale"}
                    </h1>
                    <p className="text-white/80 text-[9px] sm:text-xs font-medium font-battambang max-w-[180px] sm:max-w-sm line-clamp-1 sm:line-clamp-2">
                      {activeEvent?.description || "ការបញ្ចុះតម្លៃដ៏អស្ចារ្យបំផុតប្រចាំថ្ងៃ ចំនួនមានកំណត់។"}
                    </p>
                  </div>

                  {/* Compact Countdown Timer */}
                  <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                     <span className="text-[8px] sm:text-[10px] font-bold text-white/60 uppercase tracking-widest font-battambang">{t("ends_in")}</span>
                     <div className="flex gap-1.5 sm:gap-2">
                        {[
                          { val: timeLeft.hours, label: t("hours_label") },
                          { val: timeLeft.minutes, label: t("minutes_label") },
                          { val: timeLeft.seconds, label: t("seconds_label") }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-1 sm:gap-2">
                             <div className="size-9 sm:size-14 bg-white/10 rounded-lg sm:rounded-xl border border-white/20 flex flex-col items-center justify-center shadow-lg backdrop-blur-sm">
                                <span className="text-sm sm:text-2xl font-black text-white leading-none">
                                  {item.val.toString().padStart(2, '0')}
                                </span>
                                <span className="text-[6px] sm:text-[7px] font-bold text-white/50 mt-0.5 sm:mt-1 font-battambang">{item.label}</span>
                             </div>
                             {i < 2 && <span className="font-bold text-white/30 text-base sm:text-2xl">:</span>}
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Flash Deal Grid */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5 px-1">
               <div className="h-6 w-1 bg-primary rounded-full" />
               <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 font-battambang">{"ទំនិញ Flash Sale ពិសេស"}</h2>
               <div className="h-px flex-1 bg-zinc-100" />
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-battambang">
                 {books.length} {"មុខ"}
               </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="size-8 border-2 border-zinc-100 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-battambang">{t("loading")}</p>
              </div>
            ) : books.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
                {books.map((book: any) => (
                  <div key={book.id} className="relative group">
                    <BookCard 
                      {...book} 
                      image_url={book.images?.[0]?.image_url || book.image_url}
                      flash_sale_qty={book.flash_sale_qty}
                      items_sold={book.items_sold}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {/* Empty State / Call to Action - Only show if no books found */}
          {!loading && books.length === 0 && (
            <section className="py-16 px-6 border-2 border-dashed border-zinc-100 rounded-3xl text-center animate-in fade-in slide-in-from-bottom-4 duration-700 bg-zinc-50/30">
               <div className="size-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <Clock className="size-8 text-zinc-300" />
               </div>
               <h3 className="text-xl font-bold text-zinc-800 mb-2 font-battambang">
                 {"មិនទាន់មានការបញ្ចុះតម្លៃថ្មីៗ!"}
               </h3>
               <p className="text-zinc-400 text-sm font-medium font-battambang max-w-sm mx-auto mb-8 leading-relaxed">
                 {"សូមរង់ចាំបន្តិច! យើងនឹងនាំមកជូននូវការបញ្ចុះតម្លៃដ៏អស្ចារ្យក្នុងពេលឆាប់ៗនេះ។ កុំឱ្យរំលងឱកាសក្រោយ!"}
               </p>
               <Link href="/books" className="inline-flex items-center gap-2 px-10 py-3 bg-zinc-900 text-white rounded-full text-xs font-bold shadow-lg hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 font-battambang">
                  <span>{"មើលសៀវភៅទាំងអស់"}</span>
                  <ChevronRight className="size-3.5" />
               </Link>
            </section>
          )}
        </div>
      </main>

      <BottomNav />
      <Footer />
    </div>
  );
}
