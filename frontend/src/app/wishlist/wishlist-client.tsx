"use client";

import React, { useEffect, useState } from "react";
import { Heart, ShoppingBag, ArrowRight, Loader2, Sparkles, BookHeart } from "lucide-react";
import Link from "next/link";
import { favoritesApi } from "@/lib/api-client";
import BookCard from "@/components/book-card";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";
import { toast } from "sonner";

import { useLanguage } from "@/lib/language-context";

export default function WishlistClient() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { refreshFavoritesCount } = useFavorites();
  const { t } = useLanguage();

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await favoritesApi.list();
      // Handle potential paginated response or direct array
      const items = Array.isArray(data) ? data : (data.results || []);
      setFavorites(items);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("មិនអាចទាញយកបញ្ជីប្រាថ្នាបានទេ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user && !loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-32 flex flex-col items-center justify-center text-center">
        <div className="size-20 rounded-2xl bg-bg-soft flex items-center justify-center text-text-dim/30 mb-6 border border-border-dim">
          <BookHeart className="size-10" />
        </div>
        <h2 className="text-2xl font-black text-text-main mb-4 font-kantumruy">{t("wishlist_login_title")}</h2>
        <p className="text-text-dim font-bold mb-8 max-w-xs font-kantumruy">
          {t("wishlist_login_desc")}
        </p>
        <Link 
          href="/login"
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-black hover:bg-primary-hover transition-all shadow-lg shadow-primary/10"
        >
          {t("wishlist_login_now")} <ArrowRight className="size-5" />
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-32 flex flex-col items-center justify-center">
        <Loader2 className="size-10 text-primary animate-spin mb-4" />
        <p className="text-zinc-400 font-bold font-khmer">{t("wishlist_loading")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border-dim pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/10">
              <Sparkles className="size-3" /> {t("wishlist_personal_tag")}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-text-main font-kantumruy flex items-center gap-4">
            {t("wishlist_title")} <Heart className="size-10 text-red-500 fill-current animate-pulse" />
          </h1>
          <p className="text-text-dim font-bold mt-2 font-kantumruy">
            {t("wishlist_subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 rounded-2xl bg-bg-soft border border-border-dim">
            <p className="text-text-dim text-[10px] font-black uppercase tracking-widest mb-1 opacity-40">{t("wishlist_total_items")}</p>
            <p className="text-2xl font-black text-text-main">{favorites.length} <span className="text-sm text-text-dim/60 ml-1">{t("wishlist_items_unit")}</span></p>
          </div>
        </div>
      </div>

      {/* Content */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 sm:gap-6">
          {favorites.map((fav) => (
            <div key={fav.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BookCard 
                id={fav.book}
                {...fav.book_details} 
                isInitialFavorite={true}
                mobileCols={2}
                onRemove={(bookId) => {
                  setFavorites(prev => prev.filter(f => f.book !== bookId));
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-8">
            <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl animate-pulse" />
            <div className="relative size-32 rounded-full bg-white border border-border-dim flex items-center justify-center text-text-dim/20 shadow-premium">
              <ShoppingBag className="size-16" />
            </div>
            <Heart className="absolute -bottom-2 -right-2 size-10 text-red-500/20 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-text-main mb-2 font-kantumruy">{t("wishlist_empty_title")}</h2>
          <p className="text-text-dim font-bold mb-8 max-w-sm font-kantumruy">
            {t("wishlist_empty_desc")}
          </p>
          <Link 
            href="/books"
            className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-primary text-white font-black hover:bg-primary-hover transition-all shadow-xl shadow-primary/10 active:scale-95"
          >
            {t("wishlist_go_shopping")} <ArrowRight className="size-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
