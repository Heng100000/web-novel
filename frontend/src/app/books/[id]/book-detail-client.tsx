"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Share2,
  ChevronRight,
  Star,
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
  Tag,
  ChevronDown
} from "lucide-react";
import { getMediaUrl, apiClient, cartApi, favoritesApi } from "@/lib/api-client";
import BookCard from "@/components/book-card";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/favorites-context";
import { useRouter } from "next/navigation";

interface BookDetailClientProps {
  book: any;
  similarBooks: any[];
}

export default function BookDetailClient({ book, similarBooks }: BookDetailClientProps) {
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const { refreshFavoritesCount } = useFavorites();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(book.images?.[0]?.image_url || book.image_url);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Auto Carousel Logic
  useEffect(() => {
    if (book.images && book.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % book.images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [book.images]);

  const discount_percentage = book.discount_percentage || 0;
  const hasDiscount = (book.discounted_price && Number(book.discounted_price) < Number(book.price)) || discount_percentage > 0;

  const [isMounted, setIsMounted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if book is already in favorites
    const checkFavorite = async () => {
      if (user && book.id) {
        try {
          const res = await favoritesApi.check(book.id);
          setIsFavorite(res.is_favorite);
        } catch (error) {
          console.error("Error checking favorite:", error);
        }
      }
    };
    checkFavorite();
  }, [user, book.id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("សូមចូលប្រើប្រាស់ជាមុនសិន ដើម្បីដាក់ចូលក្នុងបញ្ជីដែលអ្នកចូលចិត្ត");
      router.push("/login");
      return;
    }

    try {
      const res = await favoritesApi.toggle(book.id);
      setIsFavorite(res.is_favorite);
      await refreshFavoritesCount();
      if (res.is_favorite) {
        toast.success("បានដាក់ចូលក្នុងបញ្ជីដែលអ្នកចូលចិត្ត");
      } else {
        toast.info("បានដកចេញពីបញ្ជីដែលអ្នកចូលចិត្ត");
      }
    } catch (error) {
      toast.error("មានបញ្ហាក្នុងការផ្លាស់ប្តូរស្ថានភាព");
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("បានចម្លងតំណភ្ជាប់ (Link) រួចរាល់ហើយ!");
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("សូមចូលប្រើប្រាស់ជាមុនសិន ដើម្បីដាក់សៀវភៅចូលកន្ត្រក");
      router.push("/login");
      return;
    }

    try {
      setIsAdding(true);
      await cartApi.addItem(book.id, quantity);
      await refreshCartCount();
      toast.success("បានដាក់ចូលកន្ត្រកដោយជោគជ័យ");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("មានបញ្ហាក្នុងការដាក់ចូលកន្ត្រក");
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQty = () => setQuantity(prev => prev + 1);
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1 pb-20 pt-16 sm:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left Column: Image with Cinematic Auto Carousel */}
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-50 shadow-sm border border-zinc-100 group">
              <div className="relative h-full w-full">
                {book.images && book.images.length > 0 ? (
                  book.images.map((img: any, idx: number) => (
                    <div
                      key={idx}
                      className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${idx === currentImageIndex
                        ? "opacity-100 translate-x-0 z-10"
                        : idx < currentImageIndex
                          ? "opacity-0 -translate-x-1/2 z-0"
                          : "opacity-0 translate-x-1/2 z-0"
                        }`}
                    >
                      <img
                        src={getMediaUrl(img.image_url)}
                        alt={`${book.title} - ${idx + 1}`}
                        className={`h-full w-full object-cover ${idx === currentImageIndex ? "animate-zoom-in-slow" : ""
                          }`}
                      />
                    </div>
                  ))
                ) : (
                  <img
                    src={getMediaUrl(book.image_url) || "/images/placeholder_book.png"}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                )}

                {/* Subtle Vignette for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-10" />
              </div>

              {/* Carousel Indicators */}
              {book.images && book.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {book.images.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`size-1.5 rounded-full transition-all ${idx === currentImageIndex
                        ? "w-4 bg-[#3b6016]"
                        : "bg-white/60 hover:bg-white"
                        }`}
                    />
                  ))}
                </div>
              )}

              {/* Ultra-Premium Animated Hanging Discount Tag */}
              {hasDiscount && (
                <>
                  <style jsx>{`
                    @keyframes kenburns {
                      from { transform: scale(1); }
                      to { transform: scale(1.15); }
                    }
                    .animate-kenburns {
                      animation: kenburns 8s linear infinite alternate;
                    }
                    @keyframes zoomInSlow {
                      0% { transform: scale(1); }
                      100% { transform: scale(1.15); }
                    }
                    .animate-zoom-in-slow {
                      animation: zoomInSlow 6s ease-out forwards;
                    }
                    @keyframes premium-swing {
                      0% { transform: rotate(12deg) skewX(2deg); }
                      50% { transform: rotate(-8deg) skewX(-2deg); }
                      100% { transform: rotate(12deg) skewX(2deg); }
                    }
                    @keyframes glint {
                      0% { left: -150%; }
                      100% { left: 150%; }
                    }
                    .animate-premium-swing {
                      animation: premium-swing 4s ease-in-out infinite;
                      transform-origin: top center;
                    }
                    .glint-effect {
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
                      animation: glint 3s infinite;
                      pointer-events: none;
                    }
                  `}</style>
                  <div className="absolute top-0 left-8 z-20 animate-premium-swing drop-shadow-[0_20px_20px_rgba(0,0,0,0.3)]">
                    {/* Hanging String - Stylized */}
                    <div className="w-[1.5px] h-6 bg-gradient-to-b from-zinc-400 to-zinc-300 mx-auto relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-zinc-400 border border-white" />
                    </div>
                    {/* Tag Body - Pointed Shape */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#ff3333] via-[#e60000] to-[#990000] text-white px-3 pt-4 pb-6 font-black text-[15px] flex flex-col items-center justify-center min-w-[56px] border-t border-l border-white/30 rounded-t-sm shadow-inner"
                      style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)' }}>
                      <div className="glint-effect" />
                      <div className="size-2 rounded-full bg-zinc-900/40 mb-1.5 shadow-inner" /> {/* Reinforced Hole */}
                      <Tag className="size-3.5 text-white/90 mb-1 drop-shadow-sm" />
                      <span className="font-kantumruy leading-none tracking-tight drop-shadow-md">
                        {discount_percentage > 0
                          ? `-${discount_percentage}%`
                          : `-${(Number(book.price_riel) - Number(book.discounted_price_riel)).toLocaleString()}៛`
                        }
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Info - Compact Redesign */}
            <div className="flex flex-col">
              {/* Title Section */}
              <h1 className="text-3xl sm:text-[36px] font-black text-[#3b6016] font-kantumruy leading-[1.1] mb-3">
                {book.title}
              </h1>

              {/* Author and Actions Row */}
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 text-[14px] font-bold font-kantumruy">
                  <span className="text-zinc-400">ដោយ</span>
                  <Link href={`/authors/${book.author}`} className="text-zinc-400 hover:text-[#3b6016] underline decoration-zinc-300">
                    {book.author_details?.name_km || book.author_details?.name || "អ្នកនិពន្ធ"}
                  </Link>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`flex size-8 items-center justify-center rounded-md transition-all shadow-sm ${isFavorite ? "bg-red-500 text-white" : "bg-[#3b6016] text-white hover:opacity-90"
                      }`}
                  >
                    <Heart className={`size-4 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex size-8 items-center justify-center rounded-md bg-[#3b6016] text-white hover:opacity-90 transition-all shadow-sm"
                  >
                    <Share2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Second Info Row: Author Repeat and Category */}
              <div className="flex items-center justify-between text-[13px] font-bold mb-3 font-kantumruy">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Link href={`/authors/${book.author}`} className="hover:text-[#3b6016]">
                    {book.author_details?.name_km || book.author_details?.name}
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Package className="size-3.5" />
                  <span>{book.category_details?.name_km || "ទូទៅ"}</span>
                </div>
              </div>

              {/* Badges Row */}
              <div className="flex gap-2 mb-4 font-kantumruy">
                <div className="flex items-center gap-1.5 bg-[#3b6016] text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                  <Tag className="size-2.5" />
                  <span>{book.edition_type || "Classic"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#3b6016] text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold">
                  <Tag className="size-2.5" />
                  <span>ថ្មី</span>
                </div>
              </div>

              <div className="h-[1px] w-full bg-zinc-100 mb-4" />

              {/* Book Summary Box - Above Price */}
              {book.description && (
                <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <div className="bg-[#f0f7e9]/50 rounded-xl p-3 border border-[#e1eed5]/50 backdrop-blur-sm relative">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="size-1.5 rounded-full bg-[#3b6016]" />
                      <span className="text-[10px] font-black text-[#3b6016] uppercase tracking-widest font-kantumruy">សេចក្តីសង្ខេប</span>
                    </div>
                    <div className="relative">
                      <p className={`text-[12px] leading-[1.7] text-zinc-600 font-kantumruy transition-all duration-500 break-words ${isDescriptionExpanded ? "" : "line-clamp-3"
                        }`}>
                        {book.description}
                      </p>

                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="text-[10px] font-black text-[#3b6016] hover:text-[#2d4a11] flex items-center gap-1.5 transition-all bg-[#3b6016]/5 px-2 py-1 rounded-md hover:bg-[#3b6016]/10"
                        >
                          <span>{isDescriptionExpanded ? "បង្ហាញតិចវិញ" : "អានបន្ថែម..."}</span>
                          <ChevronDown className={`size-3 transition-transform duration-300 ${isDescriptionExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Price and Quantity Row */}
              <div className="flex items-center justify-between mb-5 font-kantumruy">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-[28px] sm:text-[34px] font-bold text-[#ff4d4d] leading-none">
                    {Number(book.discounted_price_riel || book.price_riel).toLocaleString()}៛ ${book.discounted_price || book.price}
                  </span>
                  {hasDiscount && (
                    <span className="text-[16px] sm:text-[20px] font-normal text-zinc-300 line-through leading-none">
                      {Number(book.price_riel).toLocaleString()}៛ ${book.price}
                    </span>
                  )}
                </div>

                <div className="flex items-center bg-zinc-50 rounded-lg p-0.5 border border-zinc-100">
                  <button
                    onClick={decrementQty}
                    disabled={quantity <= 1}
                    className={`flex size-7 items-center justify-center rounded-md transition-all ${quantity > 1
                      ? "bg-[#3b6016] text-white hover:opacity-90"
                      : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                      }`}
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-9 text-center text-base font-bold text-zinc-700">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQty}
                    className="flex size-7 items-center justify-center rounded-md bg-[#3b6016] text-white hover:opacity-90 transition-all"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="mb-5 font-kantumruy">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex items-center gap-2.5 rounded-lg bg-[#3b6016] px-5 py-2 text-[14px] font-black text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md"
                >
                  <ShoppingCart className="size-4" />
                  <span>{isAdding ? "កំពុងបញ្ចូល..." : "ដាក់ចូលកន្ត្រក"}</span>
                </button>
              </div>

              <div className="h-[1px] w-full bg-zinc-100 mb-5" />
            </div>
          </div>

          {/* Similar Products */}
          {similarBooks && similarBooks.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-4 text-[14px] font-black text-zinc-400 uppercase tracking-widest font-kantumruy">ផលិតផលស្រដៀងគ្នា</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {similarBooks.map((item) => (
                  <BookCard key={item.id} {...item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
      <Footer />
    </div>
  );
}
