"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingCart, 
  ArrowRight, 
  ChevronLeft,
  Loader2,
  PackageOpen
} from "lucide-react";
import { apiClient, cartApi, getMediaUrl } from "@/lib/api-client";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import { motion, AnimatePresence } from "framer-motion";

export default function CartClient() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      // Ensure it's an array, handle different API response structures
      const cartItems = Array.isArray(data) ? data : (data as any).results || [];
      setItems(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("មិនអាចទាញយកទិន្នន័យកន្ត្រកបានទេ");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    try {
      setIsUpdating(itemId);
      await cartApi.updateItem(itemId, newQty);
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQty } : item
      ));
    } catch (error) {
      toast.error("មិនអាចកែប្រែចំនួនបានទេ");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      setIsUpdating(itemId);
      await cartApi.removeItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success("បានលុបចេញពីកន្ត្រក");
    } catch (error) {
      toast.error("មិនអាចលុបបានទេ");
    } finally {
      setIsUpdating(null);
    }
  };

  const subtotal = items.reduce((acc, item) => {
    const price = item.book_details?.discounted_price || item.book_details?.price || 0;
    return acc + (price * item.quantity);
  }, 0);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="size-10 text-[#3b6016] animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <Navbar />

      <main className="flex-grow pt-24 pb-20 sm:pt-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-[#3b6016] font-khmer flex items-center gap-3">
              <ShoppingCart className="size-8" />
              កន្ត្រកទំនិញ
            </h1>
            <Link 
              href="/books" 
              className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-[#3b6016] transition-colors"
            >
              <ChevronLeft className="size-4" />
              បន្តការទិញទំនិញ
            </Link>
          </div>

          {items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-12 text-center shadow-sm border border-zinc-100"
            >
              <div className="size-24 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-6">
                <PackageOpen className="size-12 text-zinc-300" />
              </div>
              <h2 className="text-xl font-black text-zinc-800 mb-2 font-khmer">កន្ត្រករបស់អ្នកទំនេរ</h2>
              <p className="text-zinc-500 font-bold mb-8">អ្នកមិនទាន់មានសៀវភៅនៅក្នុងកន្ត្រកនៅឡើយទេ។</p>
              <Link 
                href="/books"
                className="inline-flex items-center gap-3 rounded-full bg-[#3b6016] px-8 py-3.5 text-[15px] font-black text-white shadow-xl shadow-[#3b6016]/20 hover:opacity-90 transition-all active:scale-95"
              >
                ទៅមើលសៀវភៅទាំងអស់
                <ArrowRight className="size-5" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-zinc-100 flex gap-4 sm:gap-6 group"
                    >
                      {/* Book Image */}
                      <div className="size-24 sm:size-32 shrink-0 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100">
                        <img 
                          src={getMediaUrl(item.book_details?.image_url) || "/images/placeholder_book.png"} 
                          alt={item.book_details?.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-grow flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className="text-[15px] sm:text-[18px] font-black text-[#3b6016] font-khmer line-clamp-1">
                            {item.book_details?.title}
                          </h3>
                          <button 
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isUpdating === item.id}
                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                        
                        <p className="text-[12px] sm:text-[14px] font-bold text-zinc-400 mb-auto">
                          {item.book_details?.author_name || "អ្នកនិពន្ធមិនស្គាល់"}
                        </p>

                        <div className="flex items-center justify-between mt-4">
                          {/* Qty Controls */}
                          <div className="flex items-center gap-1 bg-zinc-50 rounded-lg p-1 border border-zinc-100">
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                              disabled={item.quantity <= 1 || isUpdating === item.id}
                              className="size-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all disabled:opacity-30"
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-black text-zinc-700">
                              {isUpdating === item.id ? <Loader2 className="size-3 animate-spin mx-auto" /> : item.quantity}
                            </span>
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                              disabled={isUpdating === item.id}
                              className="size-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all"
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-[16px] sm:text-[20px] font-black text-red-500 font-hanuman">
                              ${((item.book_details?.discounted_price || item.book_details?.price || 0) * item.quantity).toFixed(2)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-[10px] font-bold text-zinc-400">
                                ${item.book_details?.discounted_price || item.book_details?.price} / ក្បាល
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-100 sticky top-32">
                  <h2 className="text-xl font-black text-zinc-800 mb-6 font-khmer border-b border-zinc-50 pb-4">
                    សេចក្តីសង្ខេប
                  </h2>
                  
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between items-center text-zinc-500 font-bold">
                      <span>ចំនួនសរុប</span>
                      <span>{items.length} មុខ</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500 font-bold">
                      <span>តម្លៃសរុប</span>
                      <span className="font-hanuman">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500 font-bold">
                      <span>សេវាដឹកជញ្ជូន</span>
                      <span className="text-[#3b6016] uppercase text-xs">ឥតគិតថ្លៃ</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-zinc-200 pt-6 mb-8">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-lg font-black text-zinc-800 font-khmer">សរុបចុងក្រោយ</span>
                      <span className="text-2xl font-black text-red-500 font-hanuman">${subtotal.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400">រួមបញ្ចូលពន្ធ និងសេវាផ្សេងៗរួចរាល់</p>
                  </div>

                  <Link 
                    href="/checkout"
                    className="flex items-center justify-center gap-3 w-full rounded-full bg-[#3b6016] py-4 text-[16px] font-black text-white shadow-xl shadow-[#3b6016]/20 hover:opacity-90 transition-all active:scale-95"
                  >
                    បន្តទៅការទូទាត់
                    <ArrowRight className="size-5" />
                  </Link>

                  <div className="mt-6 flex flex-col gap-3">
                    <p className="text-[11px] font-bold text-zinc-400 text-center uppercase tracking-widest">យើងទទួលយក</p>
                    <div className="flex justify-center gap-2 opacity-60">
                      <img src="/images/bank.png" alt="Payments" className="h-6 object-contain" />
                    </div>
                  </div>
                </div>
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
