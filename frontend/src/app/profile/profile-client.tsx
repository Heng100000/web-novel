"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import {
  User as UserIcon,
  Mail,
  Phone,
  Camera,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Heart,
  ShoppingBag,
  Bell,
  Settings,
  ShieldAlert,
  X,
  Crop as CropIcon,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { getMediaUrl, favoritesApi, orderApi } from "@/lib/api-client";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/crop-image";
import BookCard from "@/components/book-card";
import { useLanguage } from "@/lib/language-context";

export default function ProfileClient() {
  const { user, token, loading, login, logout } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();
  const { language, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'favorites'>('info');

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  // Cropper states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Favorites & Orders states
  const [favorites, setFavorites] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [visibleOrders, setVisibleOrders] = useState(6);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!token) {
        router.push("/login");
      } else if (user) {
        setFormData({
          full_name: user.full_name || "",
          phone: user.phone || "",
        });
      }
    }
  }, [token, user, loading, router]);

  // Fetch Favorites & Orders for stats and tabs
  useEffect(() => {
    if (user) {
      const fetchInitialData = async () => {
        setIsFavoritesLoading(true);
        setIsOrdersLoading(true);
        try {
          const [favData, ords] = await Promise.all([
            favoritesApi.list(),
            orderApi.getOrders()
          ]);

          // Handle both array and paginated results for favorites & orders
          const favList = Array.isArray(favData) ? favData : ((favData as any).results || []);
          const ordList = Array.isArray(ords) ? ords : ((ords as any).results || []);
          
          setFavorites(favList);
          setOrders(ordList);
        } catch (error) {
          console.error("Error fetching initial profile data:", error);
        } finally {
          setIsFavoritesLoading(false);
          setIsOrdersLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [user]);

  // Handle tab specific re-fetching if needed
  useEffect(() => {
    if (activeTab === 'favorites' && user) {
      setIsFavoritesLoading(true);
      favoritesApi.list()
        .then((data: any) => {
          const list = Array.isArray(data) ? data : (data.results || []);
          setFavorites(list);
        })
        .catch(console.error)
        .finally(() => setIsFavoritesLoading(false));
    }
    if (activeTab === 'orders' && user) {
      setIsOrdersLoading(true);
      orderApi.getOrders()
        .then((data: any) => {
          const list = Array.isArray(data) ? data : (data.results || []);
          setOrders(list);
        })
        .catch(console.error)
        .finally(() => setIsOrdersLoading(false));
    }
  }, [activeTab, user]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(t("toast_profile_update_error"));

      const updatedUser = await response.json();
      login(token!, updatedUser);
      toast.success(t("toast_profile_update_success"), {
        icon: <CheckCircle2 className="size-5 text-green-500" />,
      });
      setIsEditing(false);
    } catch (error: any) {
      toast.error(t("toast_profile_update_error"), {
        description: error.message || t("try_again"),
        icon: <XCircle className="size-5 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      if (!file.type.startsWith("image/")) {
        toast.error(t("toast_image_only"));
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageToCrop(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const uploadCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error(t("toast_error_generic"));

      const file = new File([croppedBlob], "profile_image.jpg", { type: "image/jpeg" });
      const formDataObj = new FormData();
      formDataObj.append("profile_image", file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formDataObj,
      });

      if (!response.ok) throw new Error(t("toast_upload_failed"));

      const updatedUser = await response.json();
      login(token!, updatedUser);
      toast.success(t("toast_avatar_success"));
      setImageToCrop(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 text-[#3b6016] animate-spin" />
          <p className="text-zinc-400 font-bold font-khmer">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-khmer selection:bg-[#3b6016]/10">
      <Navbar />

      <main className="flex-1 pt-28 pb-24 md:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Avatar & Info */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm text-center relative overflow-hidden flex-1">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#3b6016] to-[#4a771c]" />

                <div className="relative mt-8 p-8 pt-4">
                  <div className="relative inline-block">
                    <div className="size-32 rounded-full border-4 border-[#3b6016]/10 ring-4 ring-white shadow-xl overflow-hidden bg-zinc-100">
                      {isUploading ? (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-50">
                          <Loader2 className="size-8 text-[#3b6016] animate-spin" />
                        </div>
                      ) : user.avatar_url ? (
                        <Image
                          src={getMediaUrl(user.avatar_url)}
                          alt={user.full_name || "User"}
                          fill
                          className="object-cover rounded-full"
                          sizes="128px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-300">
                          <UserIcon className="size-16" />
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={onSelectFile}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      title={t("edit_info")}
                      className="absolute bottom-1 right-1 size-9 bg-white rounded-full shadow-md border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-[#3b6016] transition-all disabled:opacity-50 z-10"
                    >
                      <Camera className="size-4" />
                    </button>

                    {user.avatar_url && (
                      <button
                        onClick={() => setImageToCrop(getMediaUrl(user.avatar_url))}
                        disabled={isUploading}
                        title={t("crop_image")}
                        className="absolute bottom-1 -left-1 size-9 bg-white rounded-full shadow-md border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-[#3b6016] transition-all disabled:opacity-50 z-10"
                      >
                        <CropIcon className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <h2 className="text-lg font-bold text-zinc-900 tracking-tight">{user.full_name || "អ្នកប្រើប្រាស់"}</h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded border border-zinc-200">
                        {user.role_details?.name_km || user.role_details?.name || "អ្នកប្រើប្រាស់"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-2 text-left">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 text-zinc-600 text-[13px] font-medium border border-zinc-100">
                      <Mail className="size-4 text-zinc-400" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 text-zinc-600 text-[13px] font-medium border border-zinc-100">
                      <ShieldCheck className="size-4 text-zinc-400" />
                      <span>{t("joined_since")} {new Date(user.created_at || Date.now()).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-1">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${activeTab === 'info' ? 'bg-zinc-100 text-[#3b6016] font-bold' : 'text-zinc-600 hover:bg-zinc-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className={`size-5 ${activeTab === 'info' ? 'text-[#3b6016]' : 'text-zinc-400'}`} />
                      <span className="text-sm">{t("personal_info")}</span>
                    </div>
                    <ChevronRight className={`size-4 ${activeTab === 'info' ? 'opacity-50' : 'opacity-30'}`} />
                  </button>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all group ${activeTab === 'orders' ? 'bg-zinc-100 text-[#3b6016] font-bold' : 'text-zinc-600 hover:bg-zinc-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className={`size-5 ${activeTab === 'orders' ? 'text-[#3b6016]' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                      <span className="text-sm">{t("order_history")}</span>
                    </div>
                    <ChevronRight className={`size-4 ${activeTab === 'orders' ? 'opacity-50' : 'opacity-30'}`} />
                  </button>

                    <button
                      onClick={() => setActiveTab('favorites')}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all group ${activeTab === 'favorites' ? 'bg-zinc-100 text-[#3b6016] font-bold' : 'text-zinc-600 hover:bg-zinc-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Heart className={`size-5 ${activeTab === 'favorites' ? 'text-[#3b6016]' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                        <span className="text-sm">{t("favorite_books")}</span>
                      </div>
                      <ChevronRight className={`size-4 ${activeTab === 'favorites' ? 'opacity-50' : 'opacity-30'}`} />
                    </button>

                    <div className="my-2 border-t border-zinc-100 mx-2" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-red-600 hover:bg-red-50 group"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="size-5 text-red-400 group-hover:text-red-600 transition-colors" />
                        <span className="text-sm font-bold font-hanuman">{t("logout")}</span>
                      </div>
                      <ChevronRight className="size-4 opacity-30 text-red-400" />
                    </button>
                </div>
              </div>
            </div>

            {/* Right Column: Main Content */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Ultra-Premium Vertical Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cart Box */}
                <div className="bg-emerald-50/40 rounded-2xl border border-emerald-100 p-6 transition-all hover:bg-emerald-50 hover:shadow-sm group text-center flex flex-col items-center">
                  <div className="size-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="size-6" />
                  </div>
                  <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest mb-1 font-hanuman">
                    {t("cart")}
                  </p>
                  <h4 className="text-2xl font-black text-emerald-900 leading-none">
                    {cartCount || 0}
                  </h4>
                </div>

                {/* Orders Box */}
                <div className="bg-blue-50/40 rounded-2xl border border-blue-100 p-6 transition-all hover:bg-blue-50 hover:shadow-sm group text-center flex flex-col items-center">
                  <div className="size-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="size-6" />
                  </div>
                  <p className="text-[10px] font-black text-blue-700/60 uppercase tracking-widest mb-1 font-hanuman">
                    {t("order_history")}
                  </p>
                  <h4 className="text-2xl font-black text-blue-900 leading-none">
                    {orders?.length || 0}
                  </h4>
                </div>

                {/* Favorites Box */}
                <div className="bg-rose-50/40 rounded-2xl border border-rose-100 p-6 transition-all hover:bg-rose-50 hover:shadow-sm group text-center flex flex-col items-center">
                  <div className="size-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Heart className="size-6" />
                  </div>
                  <p className="text-[10px] font-black text-rose-700/60 uppercase tracking-widest mb-1 font-hanuman">
                    {t("favorite_books")}
                  </p>
                  <h4 className="text-2xl font-black text-rose-900 leading-none">
                    {favorites?.length || 0}
                  </h4>
                </div>

                {/* Reward Points Box */}
                <div className="bg-amber-50/40 rounded-2xl border border-amber-100 p-6 transition-all hover:bg-amber-50 hover:shadow-sm group text-center flex flex-col items-center">
                  <div className="size-12 rounded-2xl bg-white text-amber-600 flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18.06" /><path d="M7 11h2" /><path d="M7 15h2" /><path d="M13 11h2" /><path d="M13 15h2" /></svg>
                  </div>
                  <p className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest mb-1 font-hanuman">
                    {t("reward_points_title")}
                  </p>
                  <h4 className="text-2xl font-black text-amber-900 leading-none">
                    {user?.reward_points || 0}
                  </h4>
                </div>
              </div>

              {activeTab === 'info' && (
                <>
                  <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex-1">
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                      <h3 className="text-base font-bold text-zinc-900 font-hanuman">{t("edit_info")}</h3>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-1.5 bg-white text-zinc-700 border border-zinc-300 rounded-lg text-xs font-bold transition-all hover:bg-zinc-50 shadow-sm"
                        >
                          {t("edit")}
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleUpdate} className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-zinc-700 flex items-center gap-2 font-hanuman">
                            <UserIcon className="size-3.5 text-zinc-400" />
                            {t("full_name")}
                          </label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-sm font-medium focus:ring-2 focus:ring-[#3b6016]/20 focus:border-[#3b6016] transition-all disabled:bg-zinc-50 disabled:text-zinc-500 shadow-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-zinc-700 flex items-center gap-2 font-hanuman">
                            <Phone className="size-3.5 text-zinc-400" />
                            {t("phone_number")}
                          </label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-sm font-medium focus:ring-2 focus:ring-[#3b6016]/20 focus:border-[#3b6016] transition-all disabled:bg-zinc-50 disabled:text-zinc-500 shadow-sm"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[13px] font-bold text-zinc-700 flex items-center gap-2 font-hanuman">
                            <Mail className="size-3.5 text-zinc-400" />
                            {t("email_address")}
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              readOnly
                              value={user.email}
                              className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-500 text-sm font-medium cursor-not-allowed shadow-sm"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase bg-white border border-zinc-200 px-1.5 py-0.5 rounded shadow-sm">{t("verified")}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="pt-4 flex items-center gap-3 border-t border-zinc-100">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-[#3b6016] text-white rounded-lg text-sm font-bold transition-all hover:bg-[#2d4a11] flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-4" />
                            )}
                            {t("save_changes")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 bg-white text-zinc-700 border border-zinc-300 rounded-lg text-sm font-bold transition-all hover:bg-zinc-50 shadow-sm"
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-red-50/50 border-b border-red-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="size-5 text-red-500" />
                        <h4 className="text-sm font-bold text-red-900 font-hanuman">{t("danger_zone")}</h4>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-xs text-zinc-500 font-medium font-khmer">
                        {t("delete_account_desc")}
                      </p>
                      <button className="px-5 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-sm shrink-0 font-hanuman">
                        {t("delete_account")}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'orders' && (
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <h3 className="text-base font-bold text-zinc-900 font-hanuman">
                      {t("order_history")} <span className="ml-1 text-[#3b6016]">({orders.length})</span>
                    </h3>
                  </div>

                  <div className="p-6 flex-1">
                    {isOrdersLoading ? (
                      <div className="min-h-[300px] flex items-center justify-center">
                        <Loader2 className="size-8 text-[#3b6016] animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8">
                        <div className="size-20 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4 ring-8 ring-zinc-50/50">
                          <ShoppingBag className="size-10" />
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 mb-2 font-hanuman">{t("no_orders_yet")}</h3>
                        <p className="text-zinc-500 font-medium max-w-xs mx-auto mb-8 font-khmer">
                          {t("no_orders_desc")}
                        </p>
                        <Link
                          href="/books"
                          className="px-8 py-3 bg-[#3b6016] text-white font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-[#3b6016]/20 font-hanuman"
                        >
                          {t("go_to_shop")}
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {orders.slice(0, visibleOrders).map((order: any) => (
                            <div key={order.id} className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden transition-all hover:shadow-xl hover:border-[#3b6016]/20 flex flex-col h-full shadow-sm">
                              {/* Card Header */}
                              <div className="px-4 py-3 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Order #{order.id}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border ${
                                  order.status === 'Completed' || order.status === 'Paid' ? 'bg-emerald-500 text-white border-emerald-400' :
                                  order.status === 'Cancelled' ? 'bg-rose-500 text-white border-rose-400' :
                                  'bg-amber-500 text-white border-amber-400'
                                }`}>
                                  {order.status}
                                </span>
                              </div>

                              {/* Card Body - Content */}
                              <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 mb-5">
                                  <div className="flex -space-x-3">
                                    {order.items?.slice(0, 3).map((item: any, idx: number) => (
                                      <div key={idx} className="relative size-12 rounded-xl border-2 border-white shadow-md overflow-hidden bg-zinc-100 ring-1 ring-zinc-200 transition-transform group-hover:translate-y-[-4px]" style={{ transitionDelay: `${idx * 50}ms` }}>
                                        <img 
                                          src={getMediaUrl(item.book_details?.image_url)} 
                                          alt="book" 
                                          className="w-full h-full object-cover" 
                                        />
                                      </div>
                                    ))}
                                    {order.items?.length > 3 && (
                                      <div className="size-12 rounded-xl border-2 border-white shadow-md bg-zinc-800 flex items-center justify-center text-[10px] font-black text-white ring-1 ring-zinc-200 z-10">
                                        +{order.items.length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-zinc-500 font-khmer truncate">
                                      {order.items?.length} {t("items_count")}
                                    </p>
                                    <p className="text-[10px] font-medium text-zinc-400">
                                      {new Date(order.order_date).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-auto pt-3 border-t border-zinc-50 flex items-center justify-between">
                                  <div>
                                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">{t("total_amount")}</p>
                                    <p className="text-xl font-black text-[#3b6016] leading-none">៛ {(parseFloat(order.total_amount) * 4000).toLocaleString()}</p>
                                  </div>
                                  <div className="size-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-300">
                                    <ChevronRight className="size-4" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {orders.length > visibleOrders && (
                          <div className="flex justify-center pt-2">
                            <button
                              onClick={() => setVisibleOrders(prev => prev + 6)}
                              className="px-10 py-3 border-2 border-zinc-200 text-zinc-500 font-black rounded-xl hover:border-[#3b6016] hover:text-[#3b6016] transition-all font-hanuman flex items-center gap-2 group"
                            >
                              {t("see_more")}
                              <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <h3 className="text-base font-bold text-zinc-900 font-hanuman">
                      {t("favorite_books")} <span className="ml-1 text-[#3b6016]">({favorites.length})</span>
                    </h3>
                  </div>

                  <div className="p-6 flex-1">
                    {isFavoritesLoading ? (
                      <div className="min-h-[300px] flex items-center justify-center">
                        <Loader2 className="size-8 text-[#3b6016] animate-spin" />
                      </div>
                    ) : favorites.length === 0 ? (
                      <div className="min-h-[300px] flex flex-col items-center justify-center text-center">
                        <div className="size-20 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4 ring-8 ring-zinc-50/50">
                          <Heart className="size-10" />
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 mb-2 font-hanuman">{t("empty_favorites")}</h3>
                        <p className="text-zinc-500 font-medium max-w-xs mx-auto mb-8 font-khmer">
                          {t("empty_favorites_desc")}
                        </p>
                        <Link
                          href="/books"
                          className="px-8 py-3 border-2 border-[#3b6016] text-[#3b6016] font-black rounded-xl hover:bg-[#3b6016] hover:text-white transition-all font-hanuman"
                        >
                          {t("find_books_now")}
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((fav: any) => (
                          <BookCard 
                            key={fav.id} 
                            {...fav.book_details} 
                            isInitialFavorite={true}
                            onRemove={(bookId) => {
                              setFavorites(prev => prev.filter(f => f.book === bookId));
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Crop Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800">
            <div className="flex items-center gap-3 text-white">
              <button
                onClick={() => setImageToCrop(null)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="size-6" />
              </button>
              <h3 className="text-lg font-bold font-khmer">{t("crop_image")}</h3>
            </div>
            <button
              onClick={uploadCroppedImage}
              disabled={isUploading}
              className="px-6 py-2 bg-[#3b6016] text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#4a771c] transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {t("done")}
            </button>
          </div>

          <div className="relative flex-1 bg-zinc-950">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          <div className="p-8 bg-zinc-900/50 backdrop-blur-md border-t border-zinc-800">
            <div className="max-w-xs mx-auto space-y-4">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <span>{t("zoom")}</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#3b6016]"
              />
            </div>
            <p className="text-center text-zinc-500 text-[11px] mt-6 font-medium">
              {t("crop_instructions")}
            </p>
          </div>
        </div>
      )}

      <BottomNav />
      <Footer />
    </div>
  );
}
