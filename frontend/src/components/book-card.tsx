"use client";

import Image from "next/image";
import Link from "next/link";
import { getMediaUrl, cartApi, favoritesApi } from "@/lib/api-client";
import { ShoppingCart, Heart } from "lucide-react";
import { encodeId } from "@/lib/id-obfuscator";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/favorites-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";

interface BookCardProps {
  id: number;
  title: string;
  price: number;
  price_riel?: number;
  discounted_price?: number;
  discounted_price_riel?: number;
  discount_percentage?: number;
  discount_type?: string;
  discount_value?: number;
  image_url?: string;
  author_name?: string;
  event_title?: string;
  event_type?: string;
  edition_type?: string;
  mobileCols?: number;
  isInitialFavorite?: boolean;
  onRemove?: (id: number) => void;
  flash_sale_qty?: number;
  items_sold?: number;
}

export default function BookCard({
  id,
  title,
  price,
  price_riel,
  discounted_price,
  discounted_price_riel,
  discount_percentage,
  discount_type,
  discount_value,
  image_url,
  author_name,
  event_title,
  event_type,
  edition_type,
  mobileCols = 2,
  isInitialFavorite = false,
  onRemove,
  flash_sale_qty = 0,
  items_sold = 0
}: BookCardProps) {
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const { refreshFavoritesCount } = useFavorites();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(isInitialFavorite);
  const [isFavoriting, setIsFavoriting] = useState(false);

  const is3Col = mobileCols === 3;
  const hasDiscount = (discount_percentage && discount_percentage > 0) ||
    (discounted_price && discounted_price < price) ||
    (discount_value && discount_value > 0);

  // Sync internal state when initial favorite prop changes
  useEffect(() => {
    setIsFavorite(isInitialFavorite);
  }, [isInitialFavorite]);


  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error(t("toast_login_required_fav"));
      router.push("/login");
      return;
    }

    if (isFavoriting) return;

    const previousState = isFavorite;
    setIsFavorite(!previousState); // Optimistic update

    try {
      const res = await favoritesApi.toggle(id);
      setIsFavorite(res.is_favorite); // Sync with server result
      refreshFavoritesCount(); // Update global count
      if (res.is_favorite) {
        toast.success(t("toast_fav_added"));
      } else {
        toast.info(t("toast_fav_removed"));
        if (onRemove) onRemove(id);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setIsFavorite(previousState); // Rollback on error
      toast.error(t("toast_error_generic"));
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error(t("toast_login_required_cart"));
      router.push("/login");
      return;
    }

    try {
      await cartApi.addItem(id, 1);
      await refreshCartCount();
      toast.success(t("toast_cart_added"));
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(t("toast_error_cart"));
    }
  };

  const displayPriceRiel = price_riel && price_riel > 0 ? price_riel : Math.round(parseFloat((price || 0).toString()) * 4000);
  const displayDiscountedPriceRiel = discounted_price_riel && discounted_price_riel > 0 ? discounted_price_riel : Math.round(parseFloat((discounted_price || price || 0).toString()) * 4000);

  return (
    <div className="relative flex flex-col h-full rounded-xl bg-card-bg shadow-sm border border-border-dim overflow-hidden transition-all duration-500 hover:shadow-premium">
      {/* Image Container */}
      <div className="group relative aspect-square w-full overflow-hidden bg-bg-soft transition-colors duration-500">
        <Link href={`/books/${encodeId(id)}`} className="block w-full h-full">
          <img
            src={getMediaUrl(image_url) || "/images/placeholder_book.png"}
            alt={title}
            className="w-full h-full object-cover transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] transform-gpu will-change-transform group-hover:scale-110"
          />
          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Animated Hanging Discount Tag */}
          {hasDiscount && (
            <>
              <style jsx>{`
                @keyframes premium-swing-card {
                  0% { transform: rotate(10deg) skewX(1deg); }
                  50% { transform: rotate(-6deg) skewX(-1deg); }
                  100% { transform: rotate(10deg) skewX(1deg); }
                }
                @keyframes glint-card {
                  0% { left: -150%; }
                  100% { left: 150%; }
                }
                .animate-premium-swing-card {
                  animation: premium-swing-card 4s ease-in-out infinite;
                  transform-origin: top center;
                }
                .glint-effect-card {
                  position: absolute;
                  top: 0;
                  width: 50%;
                  height: 100%;
                  background: linear-gradient(
                    to right,
                    transparent,
                    rgba(255, 255, 255, 0.4),
                    transparent
                  );
                  transform: skewX(-25deg);
                  animation: glint-card 3s infinite;
                  pointer-events: none;
                }
              `}</style>
              <div className="absolute top-0 left-4 z-10 animate-premium-swing-card drop-shadow-[0_8px_8px_rgba(0,0,0,0.1)]">
                {/* Hanging String */}
                <div className="w-[1px] h-3.5 bg-gradient-to-b from-slate-300 to-slate-200 mx-auto relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 size-1 rounded-full bg-slate-300 border border-white" />
                </div>
                {/* Tag Body */}
                <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-800 text-white px-2 pt-2.5 pb-4 font-black flex flex-col items-center justify-center min-w-[42px] border-t border-l border-white/20 rounded-t-[1px] shadow-inner"
                  style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)' }}>
                  <div className="glint-effect-card" />
                  <div className="size-1.5 rounded-full bg-white/20 mb-1 shadow-inner" />
                  <span className="text-[10px] sm:text-[11px] leading-none tracking-tight drop-shadow-md">
                    {discount_type === 'Fixed Amount' ? (
                      `-${Math.round(discount_value || 0).toLocaleString()}៛`
                    ) : (
                      `-${discount_percentage}%`
                    )}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Badges */}
          {edition_type && (
            <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 delay-75">
              {edition_type.split(',').map((type, idx) => {
                const trimmedType = type.trim();
                if (!trimmedType) return null;

                const colors: Record<string, string> = {
                  'Best Seller': 'bg-amber-500 text-white shadow-lg shadow-amber-500/40',
                  'New Arrival': 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40',
                  'Standard': 'bg-white/20 text-white backdrop-blur-md border border-white/30',
                };

                const labels: Record<string, string> = {
                  'Best Seller': t("best_sellers"),
                  'New Arrival': t("new_arrivals"),
                  'Standard': t("standard"),
                  'Special Edition': t("special_edition"),
                  'Limited': t("limited"),
                  'Reprint': t("reprint"),
                };

                return (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wide uppercase ${colors[trimmedType] || 'bg-white/20 text-white'}`}
                  >
                    {labels[trimmedType] || trimmedType}
                  </span>
                );
              })}
            </div>
          )}
        </Link>

        {/* Favorite Button Overlay (Top Right) */}
        <button
          onClick={handleToggleFavorite}
          type="button"
          disabled={isFavoriting}
          className={`absolute right-2 top-2 z-20 size-9 flex items-center justify-center rounded-lg backdrop-blur-md border border-white/20 transition-all active:scale-90 shadow-sm ${isFavorite
            ? 'bg-red-500 text-white shadow-red-500/20'
            : 'bg-white/80 text-primary hover:bg-white hover:scale-110'
            }`}
        >
          <Heart className={`size-4.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Info Container */}
      <div className={`flex flex-col flex-1 p-2.5 pb-3 ${is3Col ? 'sm:p-2.5' : 'sm:p-3'}`}>
        {/* Title and Price Grouped Together */}
        <div className="flex flex-col gap-1">
          <h3 className={`line-clamp-2 ${is3Col ? 'text-[12px]' : 'text-[14px] sm:text-[15px]'} font-black text-text-main font-kantumruy leading-tight group-hover:text-primary transition-colors duration-300`}>
            {title}
          </h3>

          <div className="flex flex-col font-hanuman">
            {hasDiscount ? (
              <div className="flex flex-col">
                {/* Original Price */}
                <div className="flex items-center gap-1.5 opacity-40 leading-none">
                  <span className="text-[9px] sm:text-[10px] font-normal text-text-dim line-through">
                    {Math.round(price_riel || displayPriceRiel).toLocaleString()}៛
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-normal text-text-dim line-through">
                    ${parseFloat(price.toString()).toFixed(2)}
                  </span>
                </div>

                {/* Discounted Price */}
                <div className="flex items-center gap-1.5 leading-none mt-0.5">
                  <span className={`${is3Col ? 'text-[11px]' : 'text-[14px] sm:text-[17px]'} font-black text-red-600`}>
                    {displayDiscountedPriceRiel.toLocaleString()}៛
                  </span>
                  <span className={`${is3Col ? 'text-[11px]' : 'text-[14px] sm:text-[17px]'} font-black text-red-600/90`}>
                    ${discounted_price}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`flex items-center gap-1.5 leading-none`}>
                <span className={`${is3Col ? 'text-[11px]' : 'text-[14px] sm:text-[16px]'} font-bold text-red-500`}>
                  {displayPriceRiel.toLocaleString()}៛
                </span>
                <span className={`${is3Col ? 'text-[11px]' : 'text-[14px] sm:text-[16px]'} font-bold text-red-500/80`}>
                  ${price}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Flash Sale Progress Bar - Integrated inside card */}
        {event_type === "FlashSale" && (
          <div className="mt-2 space-y-1.5 animate-in fade-in duration-500">
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
              <div 
                className="h-full bg-primary/60 rounded-full transition-all duration-[1500ms] ease-out" 
                style={{ 
                  width: `${Math.min(100, Math.round((items_sold / (flash_sale_qty || 1)) * 100))}%` 
                }} 
              />
            </div>
            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
              <span className="text-zinc-400">{t("sold") || "លក់ដាច់"} {Math.min(100, Math.round((items_sold / (flash_sale_qty || 1)) * 100))}%</span>
              <span className="text-primary">{Math.max(0, flash_sale_qty - items_sold)} {t("left") || "នៅសល់"}</span>
            </div>
          </div>
        )}

        {/* Button Always at Bottom */}
        <div className="mt-auto pt-2">
          <button
            onClick={handleAddToCart}
            className={`w-full ${is3Col ? 'py-1.5 rounded-md' : 'py-1.5 sm:py-2 rounded-lg'} flex items-center justify-center bg-primary text-white hover:bg-primary-hover transition-all shadow-lg shadow-primary/10 active:scale-95 group/cart`}
          >
            <ShoppingCart className={`${is3Col ? 'size-3.5' : 'size-4 sm:size-5'} mr-2 group-hover/cart:animate-bounce`} />
            <span className={`${is3Col ? 'text-[10px]' : 'text-[12px] sm:text-[13px]'} font-bold font-khmer`}>{t("add_to_cart")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
