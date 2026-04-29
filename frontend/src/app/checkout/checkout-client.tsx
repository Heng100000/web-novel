"use client";

import { useState, useEffect } from "react";
import { apiClient, getMediaUrl } from "@/lib/api-client";
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
import { Loader2 } from "lucide-react";

export default function CheckoutClient() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingCart, setFetchingCart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || user?.phone || "");
  const [notes, setNotes] = useState("");
  const [shippingMethod, setShippingMethod] = useState("J&T Express");
  const [paymentMethod, setPaymentMethod] = useState("ABA Bank");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [abapayDeeplink, setAbapayDeeplink] = useState<string | null>(null);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const shippingPrices: Record<string, number> = {
    "J&T Express": 1.50,
    "VET Express": 2.00,
  };
  const currentShippingPrice = shippingPrices[shippingMethod] || 0;

  const originalTotal = cartItems.reduce((acc, item) => {
    return acc + (parseFloat(item.book_details?.price || 0) * item.quantity);
  }, 0);
  const totalDiscount = originalTotal - total;
  const finalTotal = total + currentShippingPrice;

  useEffect(() => {
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

      // Group items and use the first batch_id found or just use the whole list
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
      // Proceed to actual submit
      proceedWithSubmit();
    } catch (err: any) {
      toast.error(err.message || "លេខកូដមិនត្រឹមត្រូវ");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async () => {
    if (!address.trim()) {
      toast.error("សូមបញ្ចូលអាសយដ្ឋានដឹកជញ្ជូន");
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
          batch_id: batchId,
          shipping_address: address,
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          notes: notes,
        }),
      });

      // Update profile info
      try {
        await apiClient("/users/me/", {
          method: "PATCH",
          body: JSON.stringify({ phone, address })
        });
      } catch (pErr) { console.error(pErr); }

      // If ABA Bank selected, initiate PayWay
      if (paymentMethod === "ABA Bank") {
        if (!orderRes || !orderRes.id) {
          toast.error("ការបញ្ជាទិញបរាជ័យ។");
          setLoading(false);
          return;
        }

        try {
          const paywayRes: any = await apiClient("/payway/initiate/", {
            method: "POST",
            body: JSON.stringify({ order_id: orderRes.id })
          });

          if (paywayRes && paywayRes.qrImage) {
            setQrImage(paywayRes.qrImage);
            setAbapayDeeplink(paywayRes.abapay_deeplink);
            setLoading(false);
            return; // Stop here, wait for scan
          } else {
            console.error("No QR Image in ABA response:", paywayRes);
            toast.error("មិនអាចបង្កើត ABA QR Code បានទេ: " + (paywayRes.description || "កំហុសមិនស្គាល់"));
            setLoading(false);
            return;
          }
        } catch (paywayErr: any) {
          toast.error("មិនអាចភ្ជាប់ទៅកាន់ ABA បានទេ: " + paywayErr.message);
          setLoading(false);
          return;
        }
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

  if (fetchingCart) {
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
    <div className="min-h-screen flex flex-col bg-[#f7faf7]/30">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-battambang">
            {/* Left Column: Order Review */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 py-1">
                <IconOrders className="size-5 text-[#3b6016]" />
                <h3 className="text-lg font-black text-[#3b6016] tracking-tight">ពិនិត្យមុនពេលចេញ</h3>
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
                          <button className="text-red-300 hover:text-red-500 transition-colors p-1 bg-red-50 rounded-md">
                            <IconTrash className="size-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[13px] font-black text-red-600 font-hanuman">{(unitPrice * 4000).toLocaleString()}៛</span>
                            <span className="text-[11px] font-bold text-red-600/70 font-hanuman">${unitPrice.toFixed(2)}</span>
                          </div>
                          {parseFloat(item.book_details.price) > unitPrice && (
                            <div className="flex items-center gap-1.5 opacity-30">
                              <span className="text-[10px] font-bold text-[#3b6016] line-through">{(parseFloat(item.book_details.price) * 4000).toLocaleString()}៛</span>
                              <span className="text-[10px] font-bold text-[#3b6016] line-through">${parseFloat(item.book_details.price).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="bg-[#f7faf7] rounded-md border border-[#3b6016]/5 px-2.5 py-1">
                             <span className="text-[11px] font-black text-[#3b6016]">ចំនួន: {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Shipping & Payment Form */}
            <div className="lg:col-span-7 flex flex-col gap-5 bg-white p-6 rounded-2xl border border-[#3b6016]/10 shadow-sm">
              {/* Address Section */}
              <div className="space-y-4">
                {!user?.profile_image && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <IconPhone className="size-4 text-[#3b6016]" />
                       <h4 className="text-xs font-black text-[#3b6016]">លេខទូរស័ព្ទ</h4>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 rounded-lg border border-[#3b6016]/10 bg-[#f7faf7]/50 px-4 text-xs font-bold text-[#3b6016] outline-none transition-all focus:border-[#3b6016]/30 focus:bg-white placeholder:text-[#3b6016]/20"
                        placeholder="សូមបញ្ចូលលេខទូរស័ព្ទសម្រាប់ទាក់ទង..."
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <IconUser className="size-4 text-[#3b6016]" />
                     <h4 className="text-xs font-black text-[#3b6016]">អាសយដ្ឋានដឹកជញ្ជូន</h4>
                  </div>
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full h-11 rounded-lg border border-[#3b6016]/10 bg-[#f7faf7]/50 pl-4 pr-10 text-xs font-bold text-[#3b6016] outline-none transition-all focus:border-[#3b6016]/30 focus:bg-white placeholder:text-[#3b6016]/20"
                        placeholder="សូមបញ្ចូលអាសយដ្ឋានលម្អិត..."
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <IconMapPin className="size-4 text-[#3b6016]/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <IconTruck className="size-4 text-[#3b6016]" />
                   <h4 className="text-xs font-black text-[#3b6016]">ជ្រើសរើសការដឹកជញ្ជូន</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: "J&T Express", name: "J&T", img: "/images/j&t.png", price: 1.50 },
                    { id: "VET Express", name: "VET", img: "/images/vet.png", price: 2.00 },
                    { id: "Pick Up", name: "មកយកផ្ទាល់", img: "/images/logo_icon.png", price: 0.00 },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setShippingMethod(m.id)}
                      className={`flex flex-col items-start rounded-xl border p-3 transition-all hover:shadow-md ${
                        shippingMethod === m.id 
                          ? "border-[#3b6016] bg-[#3b6016]/5 shadow-sm" 
                          : "border-zinc-100 bg-white shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5 w-full justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-7 overflow-hidden rounded flex items-center justify-center border border-zinc-100">
                            <img src={m.img} alt={m.name} className="w-full h-full object-contain" onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/logo_icon.png";
                              (e.target as HTMLImageElement).parentElement!.className = "size-7 bg-zinc-100 flex items-center justify-center rounded";
                            }} />
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-black text-[#3b6016] line-clamp-1">{m.name}</span>
                        </div>
                        {shippingMethod === m.id && <IconCheck className="size-3 text-[#3b6016]" />}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-auto">
                        <span className="text-[13px] font-black text-red-600 font-hanuman">{(m.price * 4000).toLocaleString()}៛</span>
                        <span className="text-[11px] font-bold text-red-600/70 font-hanuman">${m.price.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <IconPen className="size-4 text-[#3b6016]" />
                   <h4 className="text-xs font-black text-[#3b6016]">ចំណាំសម្រាប់ការដឹកជញ្ជូន</h4>
                </div>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-11 rounded-lg border border-[#3b6016]/10 bg-[#f7faf7]/50 px-4 text-xs font-bold text-[#3b6016] outline-none transition-all focus:border-[#3b6016]/30 focus:bg-white placeholder:text-[#3b6016]/20"
                  placeholder="Ex: នៅផ្ទះលេខB, etc."
                />
              </div>

              {/* Order Summary */}
              <div className="space-y-1.5 bg-[#f7faf7]/50 p-4 rounded-xl border border-[#3b6016]/5">
                <div className="flex items-center justify-between text-xs font-bold text-[#3b6016]/70">
                  <span>តម្លៃផលិតផល</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-red-600 font-hanuman">{(originalTotal * 4000).toLocaleString()}៛</span>
                    <span className="font-bold text-red-600/70 font-hanuman text-[10px]">${originalTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                {totalDiscount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-xs font-bold text-[#3b6016]/70">
                      <span>ការបញ្ចុះតម្លៃ</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-red-600 font-hanuman">-{(totalDiscount * 4000).toLocaleString()}៛</span>
                        <span className="font-bold text-red-600/70 font-hanuman text-[10px]">-${totalDiscount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#3b6016]/70">
                      <span>តម្លៃបន្ទាប់ពីបញ្ចុះ</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-red-600 font-hanuman">{(total * 4000).toLocaleString()}៛</span>
                        <span className="font-bold text-red-600/70 font-hanuman text-[10px]">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between text-xs font-bold text-[#3b6016]/70">
                  <span>សេវាដឹកជញ្ជូន</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-red-600 font-hanuman">{(currentShippingPrice * 4000).toLocaleString()}៛</span>
                    <span className="font-bold text-red-600/70 font-hanuman text-[10px]">${currentShippingPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="h-px bg-[#3b6016]/10 my-0.5" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#3b6016]">តម្លៃសរុបទាំងអស់</span>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-red-600 font-hanuman">{(finalTotal * 4000).toLocaleString()}៛</span>
                    <span className="text-xs font-bold text-red-600/70 font-hanuman">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <IconCreditCard className="size-4 text-[#3b6016]" />
                   <h4 className="text-xs font-black text-[#3b6016]">សូមជ្រើសរើសវិធីបង់លុយ</h4>
                </div>
                
                {shippingMethod === "Pick Up" ? (
                  <div className="flex items-center justify-between rounded-lg border border-[#3b6016] bg-[#3b6016]/5 p-3.5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="size-9 overflow-hidden rounded-lg bg-[#3b6016] flex items-center justify-center shadow-sm">
                        <IconCreditCard className="size-5 text-white" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-black text-[#3b6016]">បង់លុយពេលមកយកផ្ទាល់</span>
                        <span className="text-[9px] font-bold text-[#3b6016]/40">បង់ប្រាក់នៅហាងផ្ទាល់ពេលមកទទួលសៀវភៅ</span>
                      </div>
                    </div>
                    <IconCheck className="size-4 text-green-600" />
                  </div>
                ) : (
                  <button
                    onClick={() => setPaymentMethod("ABA Bank")}
                    className={`w-full flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                      paymentMethod === "ABA Bank" 
                        ? "border-[#3b6016] bg-[#eeeae5]" 
                        : "border-[#d1ccc5] bg-[#eeeae5]/50 hover:bg-[#eeeae5]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-10 overflow-hidden rounded-lg shadow-sm">
                        <img src="/images/khqr.png" alt="KHQR" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-black text-zinc-800">ABA KHQR</span>
                        <span className="text-[10px] font-bold text-zinc-500">ស្កេនដើម្បីទូទាត់ជាមួយកម្មវិធីធនាគារ</span>
                      </div>
                    </div>
                    {paymentMethod === "ABA Bank" && <IconCheck className="size-5 text-[#3b6016]" />}
                  </button>
                )}
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
                  
                  <p className="text-[10px] font-bold text-zinc-500 text-center leading-relaxed">
                    * សូមថតរូបភាព QR នេះ ឬបើកកម្មវិធី ABA ដើម្បីបង់ប្រាក់
                  </p>

                  {/* សម្រាប់តែតេស្ត Sandbox ប៉ុណ្ណោះ */}
                  <button 
                    onClick={async () => {
                      await refreshUser();
                      toast.success("ការបញ្ជាទិញទទួលបានជោគជ័យ!");
                      router.push("/dashboard/orders");
                    }}
                    className="mt-2 text-xs font-black text-[#3b6016] hover:opacity-80 transition-all border border-[#3b6016]/30 px-4 py-2 rounded-lg bg-[#3b6016]/5 w-full text-center"
                  >
                    [ តេស្តបញ្ជាទិញជោគជ័យ (Sandbox Mode) ]
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !address.trim()}
                className="w-full h-12 rounded-xl bg-[#3b6016] text-white shadow-xl shadow-[#3b6016]/20 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <IconCheck className="size-5" />
                    <span className="text-sm font-black uppercase tracking-wider">យល់ព្រមបញ្ជាទិញ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[#3b6016]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconPhone className="size-8 text-[#3b6016]" />
              </div>
              <h3 className="text-xl font-black text-[#3b6016] mb-2">បញ្ជាក់លេខកូដ OTP</h3>
              <p className="text-sm text-[#3b6016]/60 mb-6">
                លេខកូដបញ្ជាក់ ៦ ខ្ទង់ ត្រូវបានផ្ញើទៅកាន់លេខ <span className="font-bold text-[#3b6016]">{phone}</span>
              </p>
              
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full h-14 bg-[#f7faf7] border-2 border-[#3b6016]/10 rounded-xl text-center text-2xl font-black tracking-[0.5em] text-[#3b6016] outline-none focus:border-[#3b6016] transition-all mb-6"
                placeholder="000000"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 h-12 rounded-xl border border-[#3b6016]/20 text-xs font-bold text-[#3b6016] hover:bg-gray-50 transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length !== 6}
                  className="flex-[2] h-12 bg-[#3b6016] rounded-xl text-xs font-bold text-white hover:bg-[#2d4a11] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? <Loader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />}
                  បញ្ជាក់លេខកូដ
                </button>
              </div>
              
              <button 
                onClick={requestOtp}
                className="mt-6 text-xs font-bold text-[#3b6016]/40 hover:text-[#3b6016] transition-colors"
              >
                មិនទទួលបានលេខកូដ? ផ្ញើឡើងវិញ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
