"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  Check,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cartApi, getMediaUrl } from "@/lib/api-client";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { refreshCartCount } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      const cartItems = Array.isArray(data) ? data : (data as any).results || [];
      setItems(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
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
      toast.error(t("toast_cart_update_error"));
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      setIsUpdating(itemId);
      await cartApi.removeItem(itemId);
      await refreshCartCount();
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success(t("toast_cart_remove_success"));
    } catch (error) {
      toast.error(t("toast_cart_remove_error"));
    } finally {
      setIsUpdating(null);
    }
  };

  const subtotal = items.reduce((acc, item) => {
    const price = item.book_details?.discounted_price || item.book_details?.price || 0;
    return acc + (price * item.quantity);
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-[2px]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[1000] h-full w-full max-w-[400px] bg-background shadow-2xl flex flex-col font-khmer"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-card-bg border-b border-border-dim">
              <div className="flex items-center gap-3">
                <ShoppingCart className="size-6 text-primary" />
                <h2 className="text-[18px] font-black text-primary">{t("my_cart")}</h2>
              </div>
              <button 
                onClick={onClose}
                className="size-10 flex items-center justify-center rounded-lg border border-border-dim hover:bg-bg-soft transition-colors"
              >
                <X className="size-6 text-text-dim" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-text-dim">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm font-bold">{t("loading")}</p>
                </div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-text-dim/40">
                  <div className="size-20 rounded-full bg-bg-soft flex items-center justify-center border-2 border-dashed border-border-dim">
                    <ShoppingCart className="size-10" />
                  </div>
                  <p className="text-[15px] font-black">{t("empty_cart")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map((item) => {
                    const originalPrice = parseFloat(item.book_details?.price || "0");
                    const discountedPrice = parseFloat(item.book_details?.discounted_price || item.book_details?.price || "0");
                    const hasDiscount = discountedPrice < originalPrice;
                    const priceRiel = Math.round(discountedPrice * 4000);
                    const originalPriceRiel = Math.round(originalPrice * 4000);

                    return (
                      <div key={item.id} className="bg-card-bg rounded-lg border border-border-dim p-4 shadow-sm flex gap-4 relative group">
                        {/* Image */}
                        <div className="size-24 shrink-0 rounded-md overflow-hidden bg-bg-soft">
                          <img 
                            src={getMediaUrl(item.book_details?.image_url) || "/images/logo_icon.png"} 
                            alt={item.book_details?.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/logo_icon.png";
                              (e.target as HTMLImageElement).className = "size-8 opacity-20 object-contain p-4";
                            }}
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-grow flex flex-col justify-between py-1">
                          <div>
                            <h3 className="text-[14px] font-black text-text-main line-clamp-1 pr-6 mb-1 font-kantumruy">{item.book_details?.title}</h3>
                            <div className="flex items-center justify-between w-full pr-12">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[14px] font-black text-red-600 font-hanuman leading-none">{priceRiel.toLocaleString()}{t("riel_unit")}</span>
                                <span className="text-[11px] font-bold text-red-600/70 font-hanuman leading-none">${discountedPrice.toFixed(2)}</span>
                              </div>
                              {hasDiscount && (
                                <div className="flex items-center gap-1.5 opacity-30 leading-none">
                                  <span className="text-[10px] font-bold text-text-dim line-through">{originalPriceRiel.toLocaleString()}{t("riel_unit")}</span>
                                  <span className="text-[10px] font-bold text-text-dim line-through">${originalPrice.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Qty Controls */}
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                className="text-primary hover:text-primary-hover p-1 transition-colors"
                                disabled={item.quantity <= 1 || isUpdating === item.id}
                              >
                                <Minus className="size-4" />
                              </button>
                              <div className="w-9 h-8 flex items-center justify-center bg-bg-soft rounded text-[14px] font-bold text-text-main">
                                {isUpdating === item.id ? <Loader2 className="size-3 animate-spin" /> : item.quantity}
                              </div>
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                className="text-primary hover:text-primary-hover p-1 transition-colors"
                                disabled={isUpdating === item.id}
                              >
                                <Plus className="size-4" />
                              </button>
                            </div>

                            </div>
                          </div>

                        {/* Delete Button */}
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="absolute right-3 top-3 p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Action */}
            {items.length > 0 && (
              <div className="p-6 pb-24 md:pb-10 flex flex-col items-center border-t border-border-dim bg-card-bg">
                <Link 
                  href="/checkout"
                  onClick={onClose}
                  className="w-full btn-primary h-14 text-[17px]"
                >
                  <Check className="size-6 transition-transform group-hover:scale-110" />
                  {t("checkout")}
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

