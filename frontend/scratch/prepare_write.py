
content = """# -*- coding: utf-8 -*-
"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { IconTruck, IconCreditCard, IconCheck, IconBooks, IconChevronRight } from "../dashboard-icons";

interface CheckoutModalProps {
  batchId: string;
  items: any[];
  total: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckoutModal({ batchId, items, total, onSuccess, onCancel }: CheckoutModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState(user?.address || user?.phone || "");
  const [shippingMethod, setShippingMethod] = useState("J&T Express");
  const [paymentMethod, setPaymentMethod] = useState("ABA Bank");
  const [transactionId, setTransactionId] = useState("");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [percentageToUse, setPercentageToUse] = useState<number>(0);

  // Auto-fill when user changes or modal opens
  useEffect(() => {
    if (user && !address) {
      setAddress(user.address || user.phone || "");
    }
  }, [user]);

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
  const finalTotal = total - discountAmount;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient("/orders/checkout/", {
        method: "POST",
        body: JSON.stringify({
          batch_id: batchId,
          shipping_address: address,
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          user_coupon_id: selectedCoupon?.id || null,
          percentage_to_use: percentageToUse,
        }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: "ដឹកជញ្ជូន", icon: IconTruck },
    { id: 2, name: "បង់ប្រាក់", icon: IconCreditCard },
    { id: 3, name: "បញ្ជាក់", icon: IconCheck },
  ];

  return (
    <div className="flex flex-col gap-8 py-2">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between px-4">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div className={`flex size-10 items-center justify-center rounded-2xl transition-all duration-500 ${
                step >= s.id ? "bg-primary dark:bg-emerald-600 text-white shadow-lg shadow-primary/20 dark:shadow-emerald-900/40" : "bg-bg-soft text-text-dim"
              }`}>
                <s.icon className="size-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                step >= s.id ? "text-primary dark:text-emerald-500" : "text-text-dim"
              } font-battambang`}>{s.name}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 mx-4 h-0.5 bg-bg-soft relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-primary dark:bg-emerald-600 transition-all duration-700 ease-in-out" 
                  style={{ width: step > s.id ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="min-h-[300px] rounded-3xl bg-bg-soft/20 border border-grayborde p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 font-battambang">
            <div>
              <h3 className="text-lg font-black text-text-main uppercase tracking-tight">ព័ត៌មានលម្អិតនៃការដឹកជញ្ជូន</h3>
              <p className="text-xs font-bold text-text-dim mt-1 uppercase tracking-widest">ជ្រើសរើសក្រុមហ៊ុនដឹកជញ្ជូន និងទីតាំងរបស់អ្នក</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "J&T Express", name: "J&T Express", sub: "ដឹកជញ្ជូនរហ័ស" },
                { id: "VET Express", name: "VET Express", sub: "វីរៈប៊ុនថាំ" },
                { id: "Pick Up", name: "មកយកផ្ទាល់", sub: "នៅបណ្ណាគារ" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setShippingMethod(m.id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                    shippingMethod === m.id 
                      ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20" 
                      : "border-grayborde bg-card-bg text-text-dim hover:border-text-dim/30"
                  }`}
                >
                  <div className="flex flex-col text-center">
                    <span className="text-xs font-black uppercase tracking-tight">{m.name}</span>
                    <span className="text-[9px] font-bold opacity-60 uppercase">{m.sub}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-black text-text-dim uppercase tracking-widest px-1">
                {shippingMethod === "Pick Up" ? "ព័ត៌មានទំនាក់ទំនង" : "អាសយដ្ឋានដឹកជញ្ជូន"}
              </label>
              
              {(user?.address || user?.phone) && !address.includes('\\n') && address.length > 0 ? (
                <div className="flex flex-col gap-3 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 ring-1 ring-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                       <IconCheck className="size-4" />
                       <span className="text-xs font-black uppercase tracking-tight">ព័ត៌មានដែលបានរក្សាទុក</span>
                    </div>
                    <button 
                      onClick={() => setAddress("")} 
                      className="text-[10px] font-black text-primary hover:underline uppercase"
                    >
                      ប្តូរថ្មី
                    </button>
                  </div>
                  <p className="text-sm font-bold text-text-main font-battambang">
                    {address}
                  </p>
                </div>
              ) : (
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-grayborde bg-card-bg p-5 text-sm font-bold text-text-main outline-none transition-all focus:border-primary dark:focus-border-emerald-500 placeholder:text-text-dim/40 resize-none shadow-sm font-battambang"
                  placeholder={shippingMethod === "Pick Up" ? "សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក..." : "សូមបញ្ចូលអាសយដ្ឋាន ផ្លូវ ទីក្រុង និងលេខទូរស័ព្ទរបស់អ្នក..."}
                />
              )}
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200/50 dark:border-amber-900/30">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-wide">
                សម្គាល់៖ ការដឹកជញ្ជូនមានរយៈពេលពី ១ ទៅ ៣ ថ្ងៃ អាស្រ័យលើទីតាំងរបស់អ្នក។
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 font-battambang">
            <div>
              <h3 className="text-lg font-black text-text-main uppercase tracking-tight">វិធីសាស្ត្រទូទាត់ប្រាក់</h3>
              <p className="text-xs font-bold text-text-dim mt-1 uppercase tracking-widest">ជ្រើសរើសវិធីសាស្ត្រដែលអ្នកពេញចិត្ត</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: "ABA Bank", desc: "ABA Bank (KHQR)", sub: "ផ្ទេរប្រាក់តាមរយៈការស្កេន QR Code ABA" },
                { id: "ACLEDA Bank", desc: "ACLEDA Bank (KHQR)", sub: "ផ្ទេរប្រាក់តាមរយៈការស្កេន QR Code ACLEDA" },
                { id: "Cash", desc: "បង់ប្រាក់ផ្ទាល់", sub: "បង់ប្រាក់នៅពេលទទួលបានទំនិញ (COD)" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex items-center justify-between rounded-2xl border-2 p-5 transition-all ${
                    paymentMethod === m.id 
                      ? "border-primary dark:border-emerald-500 bg-primary/5 dark:bg-emerald-500/10 text-primary dark:text-emerald-500 shadow-sm" 
                      : "border-grayborde bg-card-bg text-text-dim hover:border-text-dim/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                     <div className={`flex size-10 items-center justify-center rounded-xl ${paymentMethod === m.id ? "bg-primary text-white" : "bg-bg-soft"}`}>
                        <IconCreditCard className="size-5" />
                     </div>
                     <div className="flex flex-col text-left font-battambang">
                        <span className="text-sm font-black uppercase tracking-wide">{m.desc}</span>
                        <span className="text-[10px] font-bold opacity-70 uppercase">{m.sub}</span>
                     </div>
                  </div>
                  {paymentMethod === m.id && <IconCheck className="size-5" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 font-battambang">
            <div>
              <h3 className="text-lg font-black text-text-main uppercase tracking-tight">ការបញ្ជាក់ការបញ្ជាទិញ</h3>
              <p className="text-xs font-bold text-text-dim mt-1 uppercase tracking-widest">ពិនិត្យមើលជាចុងក្រោយមុននឹងបញ្ជាទិញ</p>
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-bg-soft/30 p-3 ring-1 ring-grayborde">
                  <div className="flex items-center gap-3">
                    <IconBooks className="size-4 text-text-dim" />
                    <span className="text-xs font-bold text-text-main">{item.book_details.title} (x{item.quantity})</span>
                  </div>
                  <span className="text-xs font-black text-text-main">
                    ${(parseFloat(item.book_details.discounted_price || item.book_details.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            {coupons.length > 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <label className="text-[11px] font-black text-text-dim uppercase tracking-widest px-1">ជ្រើសរើសប័ណ្ណបញ្ចុះតម្លៃ (Coupon)</label>
                <div className="grid grid-cols-1 gap-2">
                  {coupons.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        if (selectedCoupon?.id === c.id) {
                          setSelectedCoupon(null);
                          setPercentageToUse(0);
                        } else {
                          setSelectedCoupon(c);
                          setPercentageToUse(c.remaining_percentage); // Default to full remaining
                        }
                      }}
                      className={`flex items-center justify-between rounded-xl border-2 p-3 transition-all ${
                        selectedCoupon?.id === c.id 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "border-grayborde bg-card-bg text-text-dim hover:border-primary/30"
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-black uppercase">{c.coupon_code || c.coupon_details?.code}</span>
                        <span className="text-[9px] font-bold opacity-60">នៅសល់: {parseFloat(c.remaining_percentage).toFixed(2)}%</span>
                      </div>
                      {selectedCoupon?.id === c.id && <IconCheck className="size-4" />}
                    </button>
                  ))}
                </div>

                {selectedCoupon && (
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-primary uppercase">កំណត់ភាគរយដែលត្រូវប្រើ</span>
                      <span className="text-xs font-black text-primary">{percentageToUse}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max={selectedCoupon.remaining_percentage} 
                      step="1"
                      value={percentageToUse}
                      onChange={(e) => setPercentageToUse(parseInt(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-grayborde rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[9px] font-bold text-text-dim opacity-60 text-center uppercase">អូសដើម្បីកំណត់ភាគរយបញ្ចុះតម្លៃ</p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-primary p-5 text-white shadow-xl shadow-primary/20 font-battambang">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                <span>ចំនួនទឹកប្រាក់ដែលត្រូវបង់សរុប</span>
                <span>{items.length} មុខសៀវភៅ</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-black tracking-tight ${discountAmount > 0 ? 'line-through opacity-50 text-sm' : ''}`}>${total.toFixed(2)}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest">{paymentMethod === 'Cash' ? 'បង់ប្រាក់ផ្ទាល់' : paymentMethod}</span>
                  </div>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between animate-in slide-in-from-top-1 duration-300">
                    <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full">បញ្ចុះតម្លៃ {percentageToUse}% (-${discountAmount.toFixed(2)})</span>
                    <span className="text-2xl font-black tracking-tight">${finalTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section for Banks */}
            {(paymentMethod === "ABA Bank" || paymentMethod === "ACLEDA Bank") && (
              <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className={`relative flex flex-col items-center gap-6 rounded-2xl p-8 shadow-2xl border-2 overflow-hidden ${
                  paymentMethod === "ABA Bank" ? "bg-white dark:bg-zinc-900 border-[#005a9c]/10" : "bg-white dark:bg-zinc-900 border-[#fefce8]/50"
                }`}>
                   {/* Decorative Background Accent */}
                   <div className={`absolute -top-24 -right-24 size-48 rounded-full blur-3xl opacity-20 ${
                     paymentMethod === "ABA Bank" ? "bg-[#005a9c]" : "bg-[#013253]"
                   }`} />
                   
                   <div className="flex flex-col items-center gap-2 relative">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm ${
                        paymentMethod === "ABA Bank" ? "text-white bg-[#005a9c]" : "text-white bg-[#013253]"
                      }`}>Scan to Pay ស្កេនបង់ប្រាក់</span>
                      <h4 className="text-sm font-black text-text-dim/40 uppercase tracking-tighter">{paymentMethod}</h4>
                   </div>
                   
                   {/* Large QR Container */}
                   <div className={`relative aspect-square w-64 rounded-xl p-3 bg-white shadow-2xl ring-1 ring-zinc-100 ${
                      paymentMethod === "ABA Bank" ? "ring-[#005a9c]/20" : "ring-[#fefce8]/50"
                   }`}>
                      <img 
                        src={paymentMethod === "ABA Bank" ? "/images/aba-qr.png" : "/images/acleda-qr.png"} 
                        alt={`${paymentMethod} QR`} 
                        className="w-full h-full object-contain" 
                      />
                      {/* Corner Accents */}
                      <div className={`absolute -top-1 -left-1 size-4 border-t-4 border-l-4 rounded-tl-lg ${paymentMethod === "ABA Bank" ? "border-[#005a9c]" : "border-[#013253] shadow-sm"}`} />
                      <div className={`absolute -top-1 -right-1 size-4 border-t-4 border-r-4 rounded-tr-lg ${paymentMethod === "ABA Bank" ? "border-[#005a9c]" : "border-[#013253] shadow-sm"}`} />
                      <div className={`absolute -bottom-1 -left-1 size-4 border-b-4 border-l-4 rounded-bl-lg ${paymentMethod === "ABA Bank" ? "border-[#005a9c]" : "border-[#013253] shadow-sm"}`} />
                      <div className={`absolute -bottom-1 -right-1 size-4 border-b-4 border-r-4 rounded-tr-lg ${paymentMethod === "ABA Bank" ? "border-[#005a9c]" : "border-[#013253] shadow-sm"}`} />
                   </div>
                   
                   <div className="flex flex-col items-center gap-3 w-full relative">
                      <div className="text-center">
                        <p className="text-base font-black text-text-main font-battambang">បណ្ណាគារ ណូវែលអាត់មីន</p>
                        <p className="text-[10px] font-bold text-text-dim/60 uppercase tracking-widest">NovelAdmin Bookstore</p>
                      </div>
                      
                      {/* Account Number with Copy */}
                      <div className={`group flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                        paymentMethod === "ABA Bank" ? "bg-bg-soft/50 border-grayborde/50 hover:border-[#005a9c]/30" : "bg-bg-soft/50 border-grayborde/50 hover:border-primary/30"
                      }`}
                      onClick={() => {
                        const accNo = paymentMethod === "ABA Bank" ? "000 123 456" : "000 789 012";
                        navigator.clipboard.writeText(accNo.replace(/\\s/g, ''));
                        alert("ចម្លងលេខគណនីរួចរាល់!");
                      }}
                      >
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-text-dim opacity-60 uppercase tracking-widest leading-none mb-1">Account Number</span>
                            <span className={`text-lg font-black tracking-tight ${
                              paymentMethod === "ABA Bank" ? "text-[#005a9c] dark:text-[#0ea5e9]" : "text-[#013253] dark:text-amber-400"
                            }`}>
                              {paymentMethod === "ABA Bank" ? "000 123 456" : "000 789 012"}
                            </span>
                         </div>
                         <div className={`flex size-8 items-center justify-center rounded-xl transition-all group-hover:scale-110 ${
                            paymentMethod === "ABA Bank" ? "bg-[#005a9c] text-white" : "bg-[#013253] dark:bg-amber-500 text-white"
                         }`}>
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-2.5 px-2">
                   <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.15em] px-1 flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-primary" />
                      លេខប្រតិបត្តិការ (Transaction ID)
                   </label>
                   <input 
                      type="text"
                      className={`w-full h-14 rounded-xl border-2 bg-card-bg px-6 text-base font-black text-text-main outline-none transition-all uppercase placeholder:normal-case placeholder:text-text-dim/40 font-battambang shadow-sm ${
                        paymentMethod === "ABA Bank" 
                          ? "border-grayborde/40 focus:border-[#005a9c]" 
                          : "border-grayborde/40 focus:border-[#013253] dark:focus:border-primary"
                      }`}
                      placeholder={`ស្វែងរកលេខប្រតិបត្តិការក្នុង App ${paymentMethod === 'ABA Bank' ? 'ABA' : 'ACLEDA'}...`}
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                   />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
          <p className="text-center text-xs font-black text-red-600 uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-2 font-battambang">
        <button
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="btn-secondary"
        >
          {step === 1 ? "បោះបង់" : "ថយក្រោយ"}
        </button>
        
        <button
          onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
          disabled={loading || (step === 1 && !address.trim()) || (step === 3 && (paymentMethod === "ABA Bank" || paymentMethod === "ACLEDA Bank") && !transactionId.trim())}
          className="btn-primary min-w-[160px]"
        >
          {loading ? (
            "កំពុងដំណើការ..."
          ) : (
            <>
              {step === 3 ? "បញ្ជាទិញឥឡូវនេះ" : "បន្តទៅមុខទៀត"}
              <IconChevronRight className="size-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
"""

import os
target_file = r'd:\Project\book-novel\frontend\src\app\dashboard\_components\checkout-modal.tsx'
writer_file = r'd:\Project\book-novel\frontend\scratch\write_fixed_modal.py'

with open(writer_file, 'w', encoding='utf-8') as f:
    f.write(f"with open(r'{target_file}', 'w', encoding='utf-8') as f:\n")
    f.write(f"    f.write({repr(content)})")
