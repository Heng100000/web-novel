"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient, getMediaUrl, cartApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  IconTruck,
  IconCreditCard,
  IconCheck,
  IconBooks,
  IconTrash,
  IconPen,
  IconOrders,
  IconMapPin,
  IconUser,
  IconPhone
} from "../dashboard/dashboard-icons";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X, Clock, AlertCircle, UploadCloud, Camera } from "lucide-react";
import { useCart } from "@/lib/cart-context";

import { useLanguage } from "@/lib/language-context";

export default function CheckoutClient() {
  const { user, refreshUser } = useAuth();
  const { refreshCartCount } = useCart();
  const { t } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingCart, setFetchingCart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || user?.phone || "");
  const [notes, setNotes] = useState("");
  const [shippingMethod, setShippingMethod] = useState("Phnom Penh");
  const [pickupTime, setPickupTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ABA Bank");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [abapayDeeplink, setAbapayDeeplink] = useState<string | null>(null);
  const [currentTranId, setCurrentTranId] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isManualPayment, setIsManualPayment] = useState(false);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const shippingPrices: Record<string, number> = {
    "Phnom Penh": 1.50,
    "J&T Express": 2.00,
    "VET Express": 2.00,
  };
  const currentShippingPrice = shippingPrices[shippingMethod] || 0;

  const originalTotal = cartItems.reduce((acc, item) => {
    return acc + (parseFloat(item.book_details?.price || 0) * item.quantity);
  }, 0);
  const totalDiscount = originalTotal - total;
  const finalTotal = total + currentShippingPrice;
  const [paymentTimeout, setPaymentTimeout] = useState<number>(1800); // 30 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);

  const handlePaymentSuccess = async () => {
    setPollingActive(false);
    setQrImage(null);
    setPaymentSuccess(true);

    try {
      await refreshCartCount();
      await refreshUser();
    } catch (err) {
      console.error("Failed to refresh state after success:", err);
    }

    toast.success(t("checkout_success"));
  };

  const handleSandboxSuccess = async () => {
    if (!currentOrderId) return;
    setLoading(true);
    try {
      await apiClient(`/orders/${currentOrderId}/confirm_payment/`, { method: "POST" });
      handlePaymentSuccess();
    } catch (err) {
      console.error("Sandbox confirmation failed:", err);
      toast.error("បច្ចេកទេស: មិនអាចបញ្ជាក់ការបង់ប្រាក់សាកល្បងបានទេ");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendTelegramInvoice = async (orderId: number, isPaid: boolean = false, receiptFile?: File) => {
    const BOT_TOKEN = "8573326893:AAHdIS4kXHf6rGieK9KnGqj_K_6jJSeRCjo";
    const CHAT_IDS = ["6194593372", "271750762"].filter(id => id.trim() !== "");

    const rielTotal = (finalTotal * 4000).toLocaleString();
    const rielSubtotal = (total * 4000).toLocaleString();
    const rielShipping = (currentShippingPrice * 4000).toLocaleString();
    const itemsList = cartItems.map(item => `• ${item.book_details.title} (x${item.quantity})`).join("\n");
    
    // Get current date and time
    const now = new Date();
    const dateTimeStr = now.toLocaleString('km-KH', { 
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    const message = `
<b>🛍️ វិក្កយបត្របញ្ជាទិញ (Order Invoice)</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>លេខកុម្ម៉ង់:</b> <code>#${orderId}</code>
📅 <b>កាលបរិច្ឆេទ:</b> ${dateTimeStr}
👤 <b>អតិថិជន:</b> ${user?.full_name || "Guest"}
📞 <b>លេខទូរស័ព្ទ:</b> ${phone}
📍 <b>អាសយដ្ឋាន:</b> ${shippingMethod === "Pick Up" ? "មកយកនៅហាង" : address}

🚚 <b>ការដឹកជញ្ជូន:</b> ${shippingMethod}
💰 <b>ការបង់ប្រាក់:</b> ${paymentMethod}
━━━━━━━━━━━━━━━━━━
📦 <b>បញ្ជីទំនិញ (Items List):</b>
${itemsList}
━━━━━━━━━━━━━━━━━━
💵 <b>តម្លៃទំនិញ:</b> ${rielSubtotal}៛ ($${total.toFixed(2)})
🚚 <b>សេវាដឹកជញ្ជូន:</b> ${rielShipping}៛ ($${currentShippingPrice.toFixed(2)})
━━━━━━━━━━━━━━━━━━
🔥 <b>តម្លៃសរុបចុងក្រោយ:</b> <b>${rielTotal}៛ ($${finalTotal.toFixed(2)})</b>
━━━━━━━━━━━━━━━━━━
${shippingMethod === "Pick Up" ? `🕒 <b>ពេលវេលាមកយក:</b> ${pickupTime}` : ""}
${notes ? `📝 <b>ចំណាំ:</b> ${notes}` : ""}

✅ <b>ស្ថានភាព:</b> ${isPaid ? "💰 បានបង់ប្រាក់រួចរាល់" : "⏳ រង់ចាំការបង់ប្រាក់"}
    `;

    try {
      console.log("Sending Telegram notification to IDs:", CHAT_IDS);
      
      const results = await Promise.all(CHAT_IDS.map(async (chatId) => {
        if (receiptFile) {
          const formData = new FormData();
          formData.append("chat_id", chatId);
          formData.append("photo", receiptFile);
          formData.append("caption", message);
          formData.append("parse_mode", "HTML");
          
          return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: "POST",
            body: formData,
          });
        } else {
          return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: "HTML",
            }),
          });
        }
      }));
      
      const data = await Promise.all(results.map(r => r.json()));
      console.log("Telegram API Responses:", data);
    } catch (err) {
      console.error("Failed to send Telegram messages:", err);
    }
  };

  const handleManualConfirm = async () => {
    if (!currentOrderId || !receiptFile) {
      toast.error("សូមបញ្ចូលរូបភាពបញ្ជាក់ការបង់ប្រាក់");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("receipt_image", receiptFile);

      await apiClient(`/orders/${currentOrderId}/confirm_payment/`, {
        method: "POST",
        body: formData,
      });

      // Send Telegram for KHQR after payment confirmation with the receipt file
      await sendTelegramInvoice(currentOrderId, true, receiptFile);

      handlePaymentSuccess();
      setIsManualPayment(false);
      setReceiptFile(null);
      setReceiptPreview(null);
    } catch (err: any) {
      toast.error("ការបញ្ជាក់ការបង់ប្រាក់មិនបានសម្រេច: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    if (pollingActive && currentTranId && !paymentSuccess && !isExpired) {
      timerInterval = setInterval(() => {
        setPaymentTimeout((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            setPollingActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      interval = setInterval(async () => {
        try {
          const res: any = await apiClient(`/payway/check-status/?tran_id=${currentTranId}`);
          if (res && (res.status === 0 || res.status === "0" || res.payment_status === "Paid")) {
            handlePaymentSuccess();
          }
        } catch (err) {
          console.error("Status check failed", err);
        }
      }, 5000); // Polling every 5 seconds to reduce server load
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [pollingActive, currentTranId, paymentSuccess, isExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (qrImage || showOtpModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [qrImage, showOtpModal]);

  useEffect(() => {
    setMounted(true);
    fetchCartData();
  }, []);

  const fetchCartData = async () => {
    try {
      setFetchingCart(true);
      const res: any = await apiClient("/add-to-cart/");
      const entries = Array.isArray(res) ? res : res.results || [];

      if (entries.length === 0) {
        toast.error("កន្ត្រកទំនិញរបស់អ្នកគឺទទេ");
        router.push("/cart");
        return;
      }

      setCartItems(entries);
      setBatchId(entries[0].batch_id);

      const subtotal = entries.reduce((sum: number, item: any) => {
        const price = parseFloat(item.book_details?.discounted_price?.toString() || item.book_details?.price || "0");
        return sum + (price * item.quantity);
      }, 0);

      setTotal(subtotal);
    } catch (err) {
      console.error("Failed to fetch cart data", err);
      toast.error("មានបញ្ហាក្នុងការទាញយកទិន្នន័យ");
    } finally {
      setFetchingCart(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);
      await refreshCartCount();
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedItems);

      const subtotal = updatedItems.reduce((sum: number, item: any) => {
        const price = parseFloat(item.book_details?.discounted_price?.toString() || item.book_details?.price || "0");
        return sum + (price * item.quantity);
      }, 0);
      setTotal(subtotal);

      if (updatedItems.length === 0) {
        toast.success(t("checkout_empty_cart"));
        router.push("/");
      } else {
        toast.success(t("toast_cart_remove_success"));
      }
    } catch (err) {
      toast.error(t("toast_cart_remove_error"));
    }
  };

  const requestOtp = async () => {
    if (!phone || phone.length < 9) {
      toast.error("សូមបញ្ចូលលេខទូរស័ព្ទឱ្យបានត្រឹមត្រូវ");
      return;
    }

    setLoading(true);
    try {
      await apiClient("/users/request-otp/", {
        method: "POST",
        body: JSON.stringify({ phone })
      });
      setIsOtpSent(true);
      setShowOtpModal(true);
      toast.success("លេខកូដ OTP ត្រូវបានផ្ញើទៅកាន់លេខទូរស័ព្ទរបស់អ្នក");
    } catch (err: any) {
      toast.error(err.message || "មិនអាចផ្ញើលេខកូដបានទេ");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error("សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់");
      return;
    }

    setVerifyingOtp(true);
    try {
      await apiClient("/users/verify-otp/", {
        method: "POST",
        body: JSON.stringify({ code: otpCode })
      });
      setOtpVerified(true);
      setShowOtpModal(false);
      toast.success("ផ្ទៀងផ្ទាត់ជោគជ័យ!");
      proceedWithSubmit();
    } catch (err: any) {
      toast.error(err.message || "លេខកូដមិនត្រឹមត្រូវ");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async () => {
    if (shippingMethod !== "Pick Up" && !address.trim()) {
      toast.error("សូមបញ្ចូលអាសយដ្ឋានដឹកជញ្ជូន");
      return;
    }
    if (shippingMethod === "Pick Up" && !pickupTime.trim()) {
      toast.error("សូមបញ្ចូលពេលវេលាដែលអ្នកនឹងមកយកសៀវភៅ");
      return;
    }
    proceedWithSubmit();
  };

  const proceedWithSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderRes: any = await apiClient("/orders/checkout/", {
        method: "POST",
        body: JSON.stringify({
          batch_id: batchId || "none",
          shipping_address: shippingMethod === "Pick Up" ? "Pick Up at Store" : address,
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          notes: shippingMethod === "Pick Up" ? `[Pick-up Time: ${pickupTime}] ${notes}` : notes,
        }),
      });

      if (orderRes && orderRes.id) {
        setCurrentOrderId(orderRes.id);
      }

      try {
        await apiClient("/users/me/", {
          method: "PATCH",
          body: JSON.stringify({ phone, address })
        });
      } catch (pErr) { console.error(pErr); }

      if (paymentMethod === "Cash") {
        await sendTelegramInvoice(orderRes.id, false);
        await refreshCartCount();
        await refreshUser();
        toast.success("ការកុម្ម៉ង់ទទួលបានជោគជ័យ! សូមអញ្ជើញមកបង់ប្រាក់នៅហាងផ្ទាល់។");
        router.push("/dashboard/orders");
        return;
      }

      if (paymentMethod === "ABA Bank") {
        if (!orderRes || !orderRes.id) {
          toast.error("ការបញ្ជាទិញបរាជ័យ។");
          setLoading(false);
          return;
        }
        setQrImage("/images/khqrABA.png");
        setIsManualPayment(true);
        setLoading(false);
        return;
      }

      await refreshUser();
      toast.success("ការបញ្ជាទិញទទួលបានជោគជ័យ!");
      router.push("/dashboard/orders");
    } catch (err: any) {
      setError(err.message || "Failed to place order. Please try again.");
      toast.error(err.message || "ការបញ្ជាទិញមិនបានសម្រេច");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || fetchingCart) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="size-10 animate-spin text-[#3b6016]" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-battambang">
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 py-1">
                <IconOrders className="size-5 text-primary" />
                <h3 className="text-lg font-black text-primary tracking-tight">{t("checkout_review")}</h3>
              </div>

              <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item, idx) => {
                  const unitPrice = parseFloat(item.book_details?.discounted_price?.toString() || item.book_details?.price || "0");
                  return (
                    <div key={idx} className="group relative flex items-center gap-3 rounded-xl border border-[#3b6016]/10 bg-white p-3 transition-all hover:shadow-sm">
                      <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-[#3b6016]/5">
                        <img
                          src={getMediaUrl(item.book_details?.image_url) || "/images/logo_icon.png"}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/logo_icon.png";
                            (e.target as HTMLImageElement).className = "size-8 opacity-20 object-contain p-6";
                          }}
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <div className="flex items-start justify-between">
                          <h4 className="text-[11px] font-black text-[#3b6016] leading-tight line-clamp-1">{item.book_details.title}</h4>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-300 hover:text-red-500 transition-colors p-1 bg-red-50 rounded-md"
                          >
                            <IconTrash className="size-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[13px] font-black text-red-600 font-hanuman">{(unitPrice * 4000).toLocaleString()}៛</span>
                            <span className="text-[11px] font-bold text-red-600/70 font-hanuman">${unitPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="bg-[#f7faf7] rounded-md border border-[#3b6016]/5 px-2.5 py-1">
                            <span className="text-[11px] font-black text-primary">{t("checkout_quantity")}: {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-5 bg-white p-6 rounded-2xl border border-[#3b6016]/10 shadow-sm">
              <div className="space-y-4">
                {/* Shipping Method Section (At the Top) */}
                <div className="space-y-3 pb-2">
                  <div className="flex items-center gap-2 text-xs font-black text-[#3b6016]">
                    <IconTruck className="size-4" />
                    <h4>ជ្រើសរើសការដឹកជញ្ជូន</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: "Phnom Penh", name: "ក្នុងភ្នំពេញ", img: "/images/delivery_pp.png", price: 1.50 },
                      { id: "J&T Express", name: "J&T", img: "/images/j&t.png", price: 2.00 },
                      { id: "VET Express", name: "VET", img: "/images/vet.png", price: 2.00 },
                      { id: "Pick Up", name: "មកយកផ្ទាល់", img: "/images/pickup.png", price: 0.00 },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setShippingMethod(m.id);
                          if (m.id !== "Pick Up" && paymentMethod === "Cash") {
                            setPaymentMethod("ABA Bank");
                          }
                        }}
                        className={`flex flex-col items-center justify-between rounded-xl border p-2.5 transition-all text-center ${shippingMethod === m.id ? "border-[#3b6016] bg-[#3b6016]/5 shadow-sm ring-1 ring-[#3b6016]/20" : "border-zinc-100 bg-white hover:border-zinc-200"}`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="size-4 invisible" /> {/* Spacer */}
                          {shippingMethod === m.id ? <IconCheck className="size-3.5 text-[#3b6016]" /> : <div className="size-3.5 rounded-full border border-zinc-200" />}
                        </div>

                        <div className="size-12 mb-2 flex items-center justify-center grayscale-[0.5] group-hover:grayscale-0 transition-all">
                          <img src={m.img} alt={m.name} className="max-w-full max-h-full object-contain" />
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-black text-[#3b6016] truncate max-w-full">{m.name}</span>
                          <span className="text-[12px] font-black text-red-600 font-hanuman">{(m.price * 4000).toLocaleString()}៛</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Conditional Pickup Time Field */}
                  <AnimatePresence>
                    {shippingMethod === "Pick Up" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden pt-2"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-primary" />
                          <h4 className="text-xs font-black text-primary">ពេលវេលាមកយក (Pick-up Time)</h4>
                        </div>
                        <input
                          type="text"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="filament-input"
                          placeholder="ឧទាហរណ៍៖ ថ្ងៃស្អែក ម៉ោង ២ រសៀល..."
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-zinc-100" />

                {/* Information Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <IconPhone className="size-4 text-primary" />
                      <h4 className="text-xs font-black text-primary">{t("checkout_phone")}</h4>
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="filament-input"
                      placeholder="សូមបញ្ចូលលេខទូរស័ព្ទសម្រាប់ទាក់ទង..."
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <IconUser className="size-4 text-primary" />
                      <h4 className="text-xs font-black text-primary">{t("checkout_address")}</h4>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="filament-input pl-4 pr-10"
                        placeholder={shippingMethod === "Pick Up" ? "មិនតម្រូវឱ្យបំពេញ..." : "សូមបញ្ចូលអាសយដ្ឋានលម្អិត..."}
                        disabled={shippingMethod === "Pick Up"}
                      />
                      <IconMapPin className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#3b6016]/40" />
                    </div>
                  </div>
                </div>

                {/* Notes Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconPen className="size-4 text-primary" />
                    <h4 className="text-xs font-black text-primary">សម្គាល់ផ្សេងៗ (Order Notes)</h4>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="filament-input min-h-[100px] py-3 resize-none"
                    placeholder="បញ្ជាក់បន្ថែមពីការដឹកជញ្ជូន ឬសំណូមពរផ្សេងៗ..."
                  />
                </div>
              </div>

              <div className="space-y-1.5 bg-[#f7faf7]/50 p-4 rounded-xl border border-[#3b6016]/5">
                <div className="flex items-center justify-between text-xs font-bold text-[#3b6016]/70">
                  <span>តម្លៃផលិតផល</span>
                  <span className="font-black text-red-600 font-hanuman">{(total * 4000).toLocaleString()}៛</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-[#3b6016]/70">
                  <span>សេវាដឹកជញ្ជូន</span>
                  <span className="font-black text-red-600 font-hanuman">{(currentShippingPrice * 4000).toLocaleString()}៛</span>
                </div>
                <div className="h-px bg-[#3b6016]/10 my-0.5" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-primary">{t("checkout_total")}</span>
                  <span className="text-lg font-black text-red-600 font-hanuman">{(finalTotal * 4000).toLocaleString()}៛</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-primary">
                  <IconCreditCard className="size-4" />
                  <h4>{t("checkout_payment_method")}</h4>
                </div>

                <button
                  onClick={() => setPaymentMethod("ABA Bank")}
                  className={`w-full flex items-center justify-between rounded-xl border p-3.5 transition-all ${paymentMethod === "ABA Bank" ? "border-primary bg-primary/5 shadow-sm" : "border-zinc-100"}`}
                >
                  <div className="flex items-center gap-4">
                    <img src="/images/khqr.png" alt="KHQR" className="w-16 h-10 object-contain rounded shadow-sm border border-zinc-100" />
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black text-text-main">{t("checkout_aba_qr")}</span>
                      <span className="text-[10px] font-bold text-text-dim">{t("checkout_aba_desc")}</span>
                    </div>
                  </div>
                  {paymentMethod === "ABA Bank" && <IconCheck className="size-5 text-primary" />}
                </button>

                {/* Cash Option - Only for Pick Up (or always, but user mentioned it for Pick Up) */}
                {shippingMethod === "Pick Up" && (
                  <button
                    onClick={() => setPaymentMethod("Cash")}
                    className={`w-full flex items-center justify-between rounded-xl border p-3.5 transition-all ${paymentMethod === "Cash" ? "border-primary bg-primary/5 shadow-sm" : "border-zinc-100"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-10 flex items-center justify-center bg-zinc-50 rounded shadow-sm border border-zinc-100">
                        <IconCreditCard className="size-6 text-zinc-400" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-black text-text-main">បង់លុយផ្ទាល់ (Cash at Store)</span>
                        <span className="text-[10px] font-bold text-text-dim">បង់ប្រាក់នៅពេលអ្នកមកយកទំនិញ</span>
                      </div>
                    </div>
                    {paymentMethod === "Cash" && <IconCheck className="size-5 text-primary" />}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {qrImage && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md transition-opacity"
                      onClick={() => { if (!loading) { setQrImage(null); setIsManualPayment(false); setPollingActive(false); } }}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 50, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.98 }}
                      transition={{ type: "spring", damping: 25, stiffness: 350 }}
                      className={`relative w-full ${isManualPayment ? 'max-w-4xl' : 'max-w-[360px]'} max-h-[95vh] overflow-y-auto bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] custom-scrollbar`}
                    >
                      <div className="bg-[#3b6016] p-6 text-white text-center relative">
                        <button onClick={() => { setQrImage(null); setIsManualPayment(false); }} className="absolute right-4 top-4 size-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all z-10"><X className="size-4" /></button>
                        <div className="flex flex-col items-center gap-2">
                          <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-inner overflow-hidden border-2 border-white/20">
                            <img src="/images/logo.png" className="size-12 object-contain" alt="Logo" />
                          </div>
                          <h4 className="text-sm font-black font-hanuman mt-1">ទូទាត់ប្រាក់ និងបញ្ជាក់ការបង់ប្រាក់</h4>
                        </div>
                      </div>
                      <div className="p-4 sm:p-8">
                        {isManualPayment ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                            <div className="flex flex-col items-center justify-center space-y-6 bg-zinc-50 rounded-xl p-6 border border-zinc-100">
                              <div className="text-center">
                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Scan to Pay</p>
                                <h5 className="text-xl font-black text-[#3b6016] font-hanuman">ABA Bank</h5>
                              </div>
                              <div className="relative size-72 sm:size-[400px] bg-white rounded-2xl p-4 shadow-xl border border-zinc-200 flex items-center justify-center group overflow-hidden">
                                <img src={qrImage} alt="ABA KHQR" className="w-full h-full object-contain scale-110" />

                                {/* Mobile Helper: Download Button */}
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = qrImage || '';
                                    link.download = 'aba-payment-qr.png';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    toast.success("រូបភាពត្រូវបានរក្សាទុក!");
                                  }}
                                  className="absolute bottom-4 right-4 size-10 bg-white shadow-xl rounded-full flex items-center justify-center text-primary hover:scale-110 transition-transform md:hidden"
                                  title="រក្សាទុករូបភាព"
                                >
                                  <UploadCloud className="size-5 rotate-180" />
                                </button>
                              </div>
                              <div className="text-center font-hanuman max-w-[280px]">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Amount</p>
                                <p className="text-2xl font-black text-red-600">៛ {(finalTotal * 4000).toLocaleString()}</p>
                                <div className="mt-3 p-2 bg-blue-50 rounded-lg md:hidden">
                                  <p className="text-[10px] text-blue-600 font-battambang leading-relaxed">
                                    💡 សម្រាប់ទូរស័ព្ទដៃ: សូមរក្សាទុករូបភាព QR នេះ រួចចូលទៅក្នុង App ធនាគាររបស់អ្នកដើម្បី "Scan from Gallery"
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-6">
                              <div>
                                <h5 className="text-lg font-black text-primary font-hanuman mb-2">បញ្ជាក់ការបង់ប្រាក់</h5>
                                <p className="text-xs text-zinc-500 font-battambang leading-relaxed">សូមធ្វើការស្កេនបង់ប្រាក់ រួចថតរូបភាព Receipt មក Upload ទីនេះដើម្បីឱ្យក្រុមការងារត្រួតពិនិត្យ។</p>
                              </div>
                              <div className="flex-grow flex flex-col items-center justify-center">
                                {receiptPreview ? (
                                  <div className="relative w-full aspect-[4/5] max-h-[300px] rounded-xl overflow-hidden border-2 border-dashed border-primary/20 bg-zinc-50 group">
                                    <img src={receiptPreview} className="w-full h-full object-contain" />
                                    <button onClick={() => { setReceiptFile(null); setReceiptPreview(null); }} className="absolute top-2 right-2 size-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="size-4" /></button>
                                  </div>
                                ) : (
                                  <label className="w-full h-full min-h-[240px] flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-primary/30 cursor-pointer transition-all">
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    <div className="size-14 rounded-full bg-white flex items-center justify-center shadow-sm border border-zinc-100 text-zinc-400 group-hover:text-primary transition-colors"><UploadCloud className="size-7" /></div>
                                    <div className="text-center"><p className="text-xs font-black text-zinc-500">ចុចដើម្បី Upload រូបភាព Receipt</p></div>
                                  </label>
                                )}
                              </div>
                              <button onClick={handleManualConfirm} disabled={loading || !receiptFile} className="w-full h-14 bg-[#3b6016] text-white rounded-xl font-black shadow-lg shadow-[#3b6016]/20 hover:opacity-90 transition-all active:scale-95 disabled:bg-zinc-200 disabled:shadow-none disabled:text-zinc-400 flex items-center justify-center gap-2 font-hanuman">{loading ? <Loader2 className="size-5 animate-spin" /> : <IconCheck className="size-5" />}ខ្ញុំបានបង់ប្រាក់រួចរាល់</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-full flex items-center justify-between mb-6 px-2">
                              <p className="text-xl font-black text-[#3b6016] font-hanuman">៛ {(finalTotal * 4000).toLocaleString()}</p>
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 font-black tabular-nums"><Clock className="size-3.5" />{formatTime(paymentTimeout)}</div>
                            </div>
                            <div className="relative mb-6">
                              <div className="absolute -inset-2 bg-zinc-50 rounded-2xl border border-zinc-100" />
                              <div className="relative size-56 bg-white rounded-xl p-2 shadow-sm border border-zinc-100 flex items-center justify-center">{isExpired ? <AlertCircle className="size-10 text-zinc-400" /> : <img src={qrImage} alt="ABA KHQR" className="w-full h-full object-contain" />}</div>
                            </div>
                            <button onClick={handleSandboxSuccess} className="w-full h-14 bg-zinc-100 text-zinc-600 rounded-xl font-black border border-zinc-200 hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2">{loading ? <Loader2 className="size-5 animate-spin" /> : <IconCheck className="size-5" />}បញ្ជាក់ការបង់ប្រាក់ (តេស្ត)</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {paymentSuccess && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-white/80 backdrop-blur-xl animate-in fade-in duration-700">
                  <div className="relative w-full max-w-md text-center animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
                    <div className="relative size-32 mx-auto mb-8">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                      <div className="relative size-32 bg-primary rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(59,96,22,0.3)]"><IconCheck className="size-16 text-white" /></div>
                    </div>
                    <h2 className="text-3xl font-black text-text-main mb-3 font-kantumruy">{t("checkout_success")}</h2>
                    <p className="text-text-dim/60 font-bold mb-10 px-8 leading-relaxed">អរគុណសម្រាប់ការគាំទ្រ! ការបញ្ជាទិញរបស់អ្នកត្រូវបានកត់ត្រាចូលក្នុងប្រព័ន្ធរួចរាល់ហើយ។</p>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => router.push("/dashboard/orders")} className="w-full h-14 bg-primary text-white rounded-2xl font-black shadow-lg hover:-translate-y-1 transition-all active:scale-95">មើលបញ្ជីការកម្ម៉ង់</button>
                      <button onClick={() => router.push("/")} className="w-full h-14 bg-bg-soft text-text-main rounded-2xl font-black border border-border-dim hover:bg-white transition-all">បន្តទិញសៀវភៅផ្សេងទៀត</button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !phone.trim() || (shippingMethod !== "Pick Up" && !address.trim())}
                className="w-full h-12 rounded-xl bg-[#3b6016] text-white shadow-xl shadow-[#3b6016]/20 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : <><IconCheck className="size-5" /><span className="text-sm font-black uppercase tracking-wider">{t("checkout_confirm_order")}</span></>}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <IconPhone className="size-16 text-primary mx-auto mb-4 bg-primary/10 rounded-full p-4" />
              <h3 className="text-xl font-black text-primary mb-2">{t("checkout_otp_title")}</h3>
              <p className="text-sm text-primary/60 mb-6">{t("checkout_otp_desc")} <span className="font-bold text-primary">{phone}</span></p>
              <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} className="w-full h-14 bg-bg-soft border-2 border-primary/10 rounded-xl text-center text-2xl font-black tracking-[0.5em] text-primary outline-none focus:border-primary transition-all mb-6" placeholder="000000" />
              <div className="flex gap-3">
                <button onClick={() => setShowOtpModal(false)} className="flex-1 h-12 rounded-xl border border-primary/20 text-xs font-bold text-primary hover:bg-gray-50 transition-colors">{t("cancel")}</button>
                <button onClick={handleVerifyOtp} disabled={verifyingOtp || otpCode.length !== 6} className="flex-[2] h-12 bg-primary rounded-xl text-xs font-bold text-white hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2">{verifyingOtp ? <Loader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}{t("checkout_otp_verify")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
