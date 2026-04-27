"use client";

import Image from "next/image";
import Link from "next/link";
import { getMediaUrl, cartApi } from "@/lib/api-client";
import { ShoppingCart, Heart } from "lucide-react";
import { encodeId } from "@/lib/id-obfuscator";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  event_title
}: BookCardProps) {
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const router = useRouter();
  const hasDiscount = (discount_percentage && discount_percentage > 0) ||
    (discounted_price && discounted_price < price) ||
    (discount_value && discount_value > 0);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("សូមចូលប្រើប្រាស់ជាមុនសិន ដើម្បីដាក់សៀវភៅចូលកន្ត្រក");
      router.push("/login");
      return;
    }

    try {
      await cartApi.addItem(id, 1);
      await refreshCartCount();
      toast.success("បានដាក់ចូលកន្ត្រកដោយជោគជ័យ");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("មានបញ្ហាក្នុងការដាក់ចូលកន្ត្រក");
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white shadow-sm border border-zinc-100 overflow-hidden transition-all hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-1">
      {/* Image Container */}
      <Link href={`/books/${encodeId(id)}`} className="relative aspect-square w-full overflow-hidden bg-zinc-50">
        <img
          src={getMediaUrl(image_url) || "/images/placeholder_book.png"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute left-2 top-2 z-10">
            <div className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-black text-white shadow-lg">
              {discount_type === 'Fixed Amount' ? (
                `-${Math.round(discount_value || 0).toLocaleString()}៛`
              ) : (
                `-${discount_percentage}%`
              )}
            </div>
          </div>
        )}

        {/* Favorite Button Overlay (Top Right) */}
        <button className="absolute right-2 top-2 z-10 size-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-[#3b6016] shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white active:scale-90">
          <Heart className="size-4" />
        </button>
      </Link>

      {/* Info Container */}
      <div className="flex flex-col gap-1.5 p-2 sm:p-2.5">
        <h3 className="line-clamp-2 text-[12px] sm:text-[13px] lg:text-[14px] font-black text-[#3b6016] font-khmer leading-tight">
          {title}
        </h3>

        <div className="flex items-center justify-between gap-1">
          <div className="flex flex-col font-hanuman">
            {hasDiscount ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] sm:text-[15px] font-bold text-red-500 leading-none">
                    {Math.round(discounted_price_riel || 0).toLocaleString()}៛
                  </span>
                  <span className="text-[13px] sm:text-[15px] font-bold text-red-500/80 leading-none">
                    ${discounted_price}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 opacity-40 leading-none ml-auto">
                  <span className="text-[10px] sm:text-[11px] font-normal text-zinc-400 line-through">
                    {Math.round(price_riel || 0).toLocaleString()}៛
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-normal text-zinc-400 line-through">
                    ${parseFloat(price.toString()).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[13px] sm:text-[15px] font-bold text-red-500">
                  {Math.round(price_riel || 0).toLocaleString()}៛
                </span>
                <span className="text-[13px] sm:text-[15px] font-bold text-red-500/80">
                  ${price}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleAddToCart}
              className="size-7 sm:size-8 flex items-center justify-center rounded-lg bg-[#3b6016] text-white hover:opacity-90 transition-all shadow-lg shadow-[#3b6016]/20 active:scale-90"
            >
              <ShoppingCart className="size-3.5 sm:size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
