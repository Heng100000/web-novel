"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { IconTruck, IconCreditCard, IconCheck, IconBooks, IconTrash, IconPlus, IconPen, IconOrders, IconUser, IconMapPin } from "../dashboard-icons";

interface CheckoutModalProps {
  batchId: string;
  items: any[];
  total: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckoutModal({ batchId, items, total, onSuccess, onCancel }: CheckoutModalProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState(user?.address || user?.phone || "");
  const [notes, setNotes] = useState("");
  const [shippingMethod, setShippingMethod] = useState("J&T Express");
  const [paymentMethod, setPaymentMethod] = useState("ABA Bank");
  const [transactionId, setTransactionId] = useState("");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [percentageToUse, setPercentageToUse] = useState<number>(0);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [abapayDeeplink, setAbapayDeeplink] = useState<string | null>(null);

  // Constants for shipping prices
  const shippingPrices: Record<string, number> = {
    "J&T Express": 1.50,
    "VET Express": 2.00,
    "Pick Up": 0.00
  };

  const currentShippingPrice = shippingPrices[shippingMethod] || 0;

  // Auto-fill when user changes or modal opens
  useEffect(() => {
    if (user && !address) {
      setAddress(user.address || user.phone || "");
    }
  }, [user]);

  // Sync address with phone when picking up
  useEffect(() => {
    if (shippingMethod === "Pick Up" && user?.phone && !address) {
      setAddress(user.phone);
    }
  }, [shippingMethod, user]);

  // Fetch user coupons on mount
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res: any = await apiClient("/user-coupons/my_coupons/");
        setCoupons(Array.isArray(res) ? res : res.results || []);
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
      }
    };
    fetchCoupons();
  }, []);

  const discountAmount = selectedCoupon ? (total * percentageToUse) / 100 : 0;
  const finalTotal = total - discountAmount + currentShippingPrice;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiClient("/orders/checkout/", {
        method: "POST",
        body: JSON.stringify({
          batch_id: batchId,
          shipping_address: address,
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          user_coupon_id: selectedCoupon?.id || null,
          percentage_to_use: percentageToUse,
          notes: notes,
        }),
      });

      // Handle ABA PayWay (S2S QR Display)
      if (paymentMethod === "ABA Bank") {
        if (!res || !res.id) {
          setError("ការបញ្ជាទិញបរាជ័យ។");
          setLoading(false);
          return;
        }

        try {
          const paywayPayload: any = await apiClient("/payway/initiate/", {
            method: "POST",
            body: JSON.stringify({ order_id: res.id }),
          });

          if (paywayPayload && paywayPayload.qrImage) {
            setQrImage(paywayPayload.qrImage);
            setAbapayDeeplink(paywayPayload.abapay_deeplink);
            setLoading(false);
            return; // Wait for user to scan
          } else {
            console.error("No QR Image in ABA response:", paywayPayload);
            setError("មិនអាចបង្កើត ABA QR Code បានទេ: " + (paywayPayload.description || "កំហុសមិនស្គាល់"));
            setLoading(false);
            return;
          }
        } catch (abaErr: any) {
          console.error("Failed to initiate ABA PayWay:", abaErr);
          setError("មិនអាចចាប់ផ្តើមការបង់ប្រាក់ ABA បានឡើយ: " + abaErr.message);
          setLoading(false);
          return;
        }
      }

      await refreshUser(); // Update reward points and profile info
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 py-2 font-battambang">
      {/* Left Column: Order Review */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="flex items-center justify-center gap-3 py-4">
          <IconOrders className="size-6 text-[#61452e]" />
          <h3 className="text-xl font-black text-[#61452e] tracking-tight">ពិនិត្យមុនពេលចេញ</h3>
        </div>

        <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {items.map((item, idx) => {
            const unitPrice = parseFloat(item.book_details?.discounted_price?.toString() || item.book_details?.price || "0");
            return (
              <div key={idx} className="group relative flex items-center gap-4 rounded-xl border border-[#61452e]/10 bg-white p-3 transition-all hover:shadow-md">
                <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-[#61452e]/5">
                  {item.book_details?.image_url ? (
                    <img src={item.book_details.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#61452e]/20">
                      <IconBooks className="size-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between">
                    <h4 className="text-[11px] font-black text-[#61452e] leading-tight line-clamp-2">{item.book_details.title}</h4>
                    <button className="text-red-300 hover:text-red-500 transition-colors p-1 bg-red-50 rounded-lg">
                      <IconTrash className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-red-600">${unitPrice.toFixed(2)}</span>
                    {item.book_details.discount_percentage > 0 && (
                      <span className="text-[10px] font-bold text-[#61452e]/30 line-through">${parseFloat(item.book_details.price).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 bg-[#fdfaf7] rounded-lg border border-[#61452e]/5 p-0.5">
                       <button className="size-6 rounded-md bg-white border border-[#61452e]/10 flex items-center justify-center text-[#61452e] text-lg font-bold">-</button>
                       <span className="text-xs font-black text-[#61452e] min-w-[20px] text-center">{item.quantity}</span>
                       <button className="size-6 rounded-md bg-white border border-[#61452e]/10 flex items-center justify-center text-[#61452e] text-lg font-bold">+</button>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-[#61452e]">តម្លៃសរុប : <span className="text-red-600">${(unitPrice * item.quantity).toFixed(2)}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Shipping & Payment Form */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Address Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <IconUser className="size-4 text-[#61452e]" />
             <h4 className="text-xs font-black text-[#61452e]">អាសយដ្ឋានដឹកជញ្ជូន</h4>
          </div>
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-12 rounded-xl border border-[#61452e]/10 bg-white pl-5 pr-12 text-sm font-bold text-[#61452e] outline-none transition-all focus:border-[#61452e]/30 placeholder:text-[#61452e]/20"
                placeholder="សូមបញ្ចូលអាសយដ្ឋាន..."
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <IconMapPin className="size-5 text-[#61452e]/40" />
              </div>
            </div>
            <button className="mt-3 w-full h-11 rounded-xl bg-[#61452e] flex items-center justify-center gap-2 text-xs font-black text-white shadow-lg shadow-[#61452e]/20 hover:opacity-95 transition-all">
               <IconCheck className="size-4" />
               រក្សាទុក
            </button>
          </div>
        </div>

        <div className="h-px bg-[#61452e]/10" />

        {/* Shipping Method */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <IconTruck className="size-4 text-[#61452e]" />
             <h4 className="text-xs font-black text-[#61452e]">ជ្រើសរើសការដឹកជញ្ជូន</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: "J&T Express", name: "J&T", img: "/images/j&t.png", price: 1.50 },
              { id: "VET Express", name: "VET", img: "/images/vet.png", price: 2.00 },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setShippingMethod(m.id)}
                className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                  shippingMethod === m.id 
                    ? "border-[#61452e] bg-[#fdfaf7]" 
                    : "border-[#61452e]/10 bg-white hover:border-[#61452e]/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 overflow-hidden rounded-lg bg-red-600 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white uppercase">{m.name}</span>
                  </div>
                  <span className="text-sm font-black text-[#61452e]">{m.name}</span>
                </div>
                <span className="text-xs font-black text-red-600">${m.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[#61452e]/10" />

        {/* Notes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <IconPen className="size-4 text-[#61452e]" />
             <h4 className="text-xs font-black text-[#61452e]">ចំណាំសម្រាប់ការដឹកជញ្ជូន</h4>
          </div>
          <input 
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-11 rounded-xl border border-[#61452e]/10 bg-white px-5 text-sm font-bold text-[#61452e] outline-none transition-all focus:border-[#61452e]/30 placeholder:text-[#61452e]/20"
            placeholder="Ex: នៅផ្ទះលេខB, etc."
          />
        </div>

        <div className="h-px bg-[#61452e]/10" />

        {/* Order Summary */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#61452e]">
            <span>តម្លៃផលិតផល</span>
            <span className="font-black text-red-600">${total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-[#61452e]">
            <span>បញ្ចុះតម្លៃ</span>
            <span className="font-black text-red-600">-${discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-[#61452e]">
            <span>តម្លៃបន្ទាប់ពីបញ្ចុះតម្លៃ</span>
            <span className="font-black text-red-600">${(total - discountAmount).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-[#61452e]">
            <span>ថ្លៃដឹកជញ្ជូន</span>
            <span className="font-black text-red-600">${currentShippingPrice.toFixed(2)}</span>
          </div>
          <div className="h-px bg-[#61452e]/10 my-2" />
          <div className="flex items-center justify-between text-sm font-black text-[#61452e]">
            <span>តម្លៃសរុបទាំងអស់</span>
            <span className="text-base text-red-600">${finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="h-px bg-[#61452e]/10" />

        {/* Payment Method */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <IconCreditCard className="size-4 text-[#61452e]" />
             <h4 className="text-xs font-black text-[#61452e]">សូមជ្រើសរើសវិធីបង់លុយ</h4>
          </div>
          <button
            onClick={() => setPaymentMethod("ABA Bank")}
            className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
              paymentMethod === "ABA Bank" 
                ? "border-[#61452e] bg-[#fdfaf7]" 
                : "border-[#61452e]/10 bg-white hover:border-[#61452e]/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="size-10 overflow-hidden rounded-lg bg-red-600 flex items-center justify-center flex-col leading-none">
                <span className="text-[10px] font-black text-white italic">KHQR</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-[#61452e]">ABA KHQR</span>
                <span className="text-[9px] font-bold text-[#61452e]/40">ស្កេនដើម្បីទូទាត់ប្រាក់ភ្លាមៗ</span>
              </div>
            </div>
            {paymentMethod === "ABA Bank" && <IconCheck className="size-4 text-green-600" />}
          </button>
        </div>

        {/* ABA QR Code Display */}
        {qrImage && (
          <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-2xl border-2 border-[#005a9c]/20 shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 my-4">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#005a9c]" />
            <h4 className="text-sm font-black text-[#005a9c] uppercase tracking-wide">Scan to Pay via ABA</h4>
            
            <div className="relative size-60 rounded-xl p-2 bg-white shadow-md ring-1 ring-[#005a9c]/10">
              <img src={qrImage} alt="ABA KHQR" className="w-full h-full object-contain" />
            </div>

            {abapayDeeplink && (
              <a 
                href={abapayDeeplink}
                className="w-full h-11 rounded-xl bg-[#005a9c] text-white flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-[#005a9c]/20 hover:opacity-95 transition-all"
              >
                <span>បើកកម្មវិធី ABA (Pay with ABA Mobile)</span>
              </a>
            )}
            
            <p className="text-[10px] font-bold text-[#61452e]/60 text-center leading-relaxed">
              * សូមថតរូបភាព QR នេះ ឬបើកកម្មវិធី ABA ដើម្បីបង់ប្រាក់
            </p>

            {/* សម្រាប់តែតេស្ត Sandbox ប៉ុណ្ណោះ */}
            <button 
              onClick={async () => {
                await refreshUser();
                onSuccess();
              }}
              className="mt-2 text-xs font-black text-emerald-600 hover:opacity-80 transition-all border border-emerald-600/30 px-4 py-2 rounded-lg bg-emerald-50 w-full text-center"
            >
              [ តេស្តបញ្ជាទិញជោគជ័យ (Sandbox Mode) ]
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !address.trim()}
          className="w-full h-12 rounded-xl bg-[#61452e] text-white shadow-xl shadow-[#61452e]/20 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <span className="animate-pulse">កំពុងដំណើរការ...</span>
          ) : (
            <>
              <IconCheck className="size-4" />
              <span className="text-sm font-black">យល់ព្រមបញ្ជាទិញ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function IconCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
