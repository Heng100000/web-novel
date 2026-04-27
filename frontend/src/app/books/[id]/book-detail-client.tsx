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
  Tag
} from "lucide-react";
import { getMediaUrl, apiClient, cartApi } from "@/lib/api-client";
import BookCard from "@/components/book-card";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";

interface BookDetailClientProps {
  book: any;
  similarBooks: any[];
}

export default function BookDetailClient({ book, similarBooks }: BookDetailClientProps) {
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(book.images?.[0]?.image_url || book.image_url);
  const [isAdding, setIsAdding] = useState(false);

  const discount_percentage = book.discount_percentage || 0;
  const hasDiscount = discount_percentage > 0;

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

      <main className="flex-1 pb-20 pt-24 sm:pt-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left Column: Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-50 shadow-sm border border-zinc-100">
              <img
                src={getMediaUrl(activeImage) || "/images/placeholder_book.png"}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Right Column: Info */}
            <div className="flex flex-col">
              {/* Title and Action Icons */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl sm:text-4xl font-black text-[#3b6016] font-khmer leading-tight">
                  {book.title}
                </h1>
                <div className="flex gap-2 shrink-0 mt-1">
                  <button className="flex size-10 items-center justify-center rounded-lg bg-[#3b6016] text-white hover:opacity-90 shadow-md transition-all">
                    <Heart className="size-5" />
                  </button>
                  <button className="flex size-10 items-center justify-center rounded-lg bg-[#3b6016] text-white hover:opacity-90 shadow-md transition-all">
                    <Share2 className="size-5" />
                  </button>
                </div>
              </div>

              {/* Author and Shop Row */}
              <div className="mb-4 flex flex-wrap items-center gap-8 text-[15px] font-bold">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Link href={`/authors/${book.author}`} className="hover:text-[#3b6016] underline decoration-zinc-200">
                    <span className="text-zinc-400 no-underline mr-1">ដោយ</span>
                    {book.author_details?.name_km || book.author_details?.name || "អ្នកនិពន្ធ"}
                  </Link>
                </div>
              </div>

              <div className="h-[1px] w-full bg-zinc-100 mb-6" />

              {/* Price and Quantity */}
              <div className="flex items-center justify-between gap-6 mb-8">
                <div className="flex items-baseline gap-4 font-hanuman text-red-500">
                  <span className="text-4xl sm:text-5xl font-medium">
                    ${book.discounted_price || book.price}
                  </span>
                  {hasDiscount && (
                    <span className="text-2xl font-normal text-zinc-300 line-through">
                      ${book.price}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <button 
                    onClick={decrementQty}
                    className={`flex size-10 items-center justify-center rounded-lg text-white hover:opacity-90 transition-all shadow-sm ${
                      quantity > 1 ? "bg-[#3b6016]" : "bg-zinc-500"
                    }`}
                  >
                    <Minus className="size-5" />
                  </button>
                  <span className="text-2xl font-bold text-zinc-800">
                    {quantity}
                  </span>
                  <button 
                    onClick={incrementQty}
                    className={`flex size-10 items-center justify-center rounded-lg text-white hover:opacity-90 transition-all shadow-sm ${
                      quantity > 1 ? "bg-[#3b6016]" : "bg-zinc-500"
                    }`}
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="mb-10">
                <button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex items-center gap-4 rounded-[12px] bg-[#3b6016] px-10 py-4 text-[18px] font-black text-white hover:opacity-95 active:scale-95 disabled:opacity-50 shadow-lg shadow-black/5 transition-all font-khmer"
                >
                  <ShoppingCart className="size-6" strokeWidth={1.5} />
                  <span>{isAdding ? "កំពុងបញ្ចូល..." : "ដាក់ចូលកន្ត្រក"}</span>
                </button>
              </div>

              <div className="h-[1px] w-full bg-zinc-100 mb-8" />
            </div>
          </div>

          {/* Similar Products */}
          {similarBooks && similarBooks.length > 0 && (
            <div className="mt-20">
              <h2 className="mb-8 text-[15px] font-black text-zinc-400 uppercase tracking-widest">ផលិតផលស្រដៀងគ្នា</h2>
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
