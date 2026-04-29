"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  IconCart, IconChevronDown, IconCheck, IconTruck,
  IconCreditCard, IconBooks, IconTrendingUp,
  IconAlertCircle, IconUserCheck, IconBan, IconFileText, IconX, IconEye
} from "../dashboard-icons";
import { InvoiceModal } from "../_components/invoice-modal";
import { formatDate, formatImageUrl } from "@/lib/utils";
import { PermissionGuard } from "../_components/permission-guard";

interface OrderItem {
  id: number;
  book_details: {
    title: string;
    price: string;
    image_url?: string;
  };
  quantity: number;
  price_at_purchase: string;
}

interface Order {
  id: number;
  order_date: string;
  total_amount: string;
  status: string;
  shipping_address: string;
  shipping_method?: string;
  items: OrderItem[];
  user_email?: string;
  user_phone?: string;
  user_name?: string;
  payment: {
    payment_method: string;
    payment_status: string;
  };
  invoice?: any;
}

interface AdminStats {
  total_revenue: number;
  today_revenue: number;
  pending_orders: number;
}

export default function OrdersHistoryPage() {
  const { user, hasPermission } = useAuth();

  // Granular permissions
  const canEdit = hasPermission('orders', 'can_edit');
  const canViewStats = hasPermission('orders', 'can_view');

  const isAdmin = (user?.role_details?.name || "").toLowerCase() === 'admin';

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const selectedOrder = orders.find(o => o.id === expandedOrder);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient<Order[]>("/orders/");
      const entries = Array.isArray(response) ? response : (response as any).results || [];
      setOrders(entries);

      if (canViewStats && isAdmin) {
        const statsRes = await apiClient<AdminStats>("/orders/stats/");
        setStats(statsRes);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, canViewStats]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleConfirmPayment = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await apiClient(`/orders/${orderId}/confirm_payment/`, { method: "POST" });
      await fetchOrders();
    } catch (err: any) {
      alert("Failed to confirm payment: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order? Stock will be restored.")) return;
    setActionLoading(orderId);
    try {
      await apiClient(`/orders/${orderId}/cancel_order/`, { method: "POST" });
      await fetchOrders();
    } catch (err: any) {
      alert("Failed to cancel order: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20";
      case "processing": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20";
      case "completed": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20";
      case "cancelled": return "bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20";
      default: return "bg-bg-soft text-text-dim ring-border-dim/10";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "រង់ចាំ";
      case "processing": return "កំពុងដំណើរការ";
      case "completed": return "រួចរាល់";
      case "cancelled": return "បានបោះបង់";
      default: return status;
    }
  };

  const getCarrierLogo = (method?: string) => {
    if (!method) return null;
    const m = method.toUpperCase();
    if (m.includes('J&T')) return '/images/j&t.png';
    if (m.includes('VET')) return '/images/vet.png';
    return null;
  };

  return (
    <PermissionGuard resource="orders">
      <div className="flex flex-col gap-8 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#3f6815]/5 text-[#3f6815] ring-1 ring-[#3f6815]/10">
              <IconCart className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-text-main font-battambang">
                {isAdmin ? "ការគ្រប់គ្រងការបញ្ជាទិញ" : "ប្រវត្តិនៃការបញ្ជាទិញ"}
              </h2>
              <p className="text-[10px] font-bold text-text-dim/60 uppercase tracking-widest mt-0.5 font-battambang">
                {isAdmin ? "ពិនិត្យមើលប្រតិបត្តិការ និងការទូទាត់របស់អតិថិជន" : "តាមដានការទិញ និងស្ថានភាពទូទាត់ប្រាក់របស់អ្នក"}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-bg-soft/50" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-grayborde bg-bg-soft/10">
            <IconCart className="size-12 text-text-dim/20 mb-4" />
            <p className="text-sm font-black text-text-dim/60 uppercase tracking-widest font-battambang">មិនទាន់មានការបញ្ជាទិញនៅឡើយទេ</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* GroupCol Left (Orders Grid Wrapped in Box) */}
            <div className="w-full lg:w-[60%] xl:w-[65%] bg-card-bg/60 border border-grayborde/40 rounded-3xl p-6 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`group flex flex-col overflow-hidden rounded-2xl border bg-card-bg transition-all ${expandedOrder === order.id ? "border-primary/40 shadow-xl ring-1 ring-primary/10 bg-bg-soft/5" : "border-grayborde shadow-sm hover:shadow-md hover:border-primary/20 hover:bg-bg-soft/5"
                      }`}
                  >
                    <div
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="p-5 cursor-pointer flex-1 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 items-center justify-center rounded-xl ring-1 shadow-sm transition-all ${expandedOrder === order.id ? "bg-primary text-white ring-primary" : "bg-primary/10 text-primary dark:text-emerald-500 ring-primary/20"}`}>
                            <IconCart className="size-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-dim/40 mb-0.5 font-battambang">
                              {isAdmin ? "អតិថិជន" : "លេខបញ្ជាទិញ"}
                            </span>
                            <span className="text-sm font-black text-text-main leading-tight truncate max-w-[130px]">
                              {isAdmin ? order.user_name || order.user_email || `User #${order.id}` : `#${order.id.toString().padStart(5, '0')}`}
                            </span>
                          </div>
                        </div>

                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ring-1 ${getStatusStyle(order.status)} font-battambang flex-nowrap`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 py-3.5 border-t border-b border-grayborde/40 my-3">
                        {isAdmin && (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-dim/40 mb-1 font-battambang">លេខទូរស័ព្ទ</span>
                            <span className="text-xs font-bold text-text-main leading-tight truncate">
                              {order.user_phone || "គ្មាន"}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-text-dim/40 mb-1 font-battambang">កាលបរិច្ឆេទ</span>
                          <span className="text-xs font-bold text-text-dim leading-tight">{formatDate(order.order_date)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 font-battambang">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-dim/40 mb-1">ចំនួនទឹកប្រាក់</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/10">
                              {(parseFloat(order.total_amount) * 4100).toLocaleString()}៛
                            </span>
                            <span className="text-xs font-black text-text-main/70">
                              / ${parseFloat(order.total_amount).toFixed(2)}
                            </span>
                          </div>
                          {order.invoice?.subtotal && parseFloat(order.invoice.subtotal) > parseFloat(order.total_amount) && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-dim/40 line-through mt-1">
                              <span>ដើម: ${parseFloat(order.invoice.subtotal).toFixed(2)}</span>
                              <span>({(parseFloat(order.invoice.subtotal) * 4100).toLocaleString()}៛)</span>
                            </div>
                          )}
                        </div>

                        <div className={`lg:hidden p-2 rounded-xl transition-all shadow-sm ${expandedOrder === order.id ? "bg-primary text-white" : "bg-bg-soft text-text-dim/60"}`}>
                          <IconEye className="size-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GroupCol Right (Order Details Panel on PC) */}
            <div className="hidden lg:block lg:w-[40%] xl:w-[35%] sticky top-24">
              {selectedOrder ? (
                <div className="rounded-2xl border border-primary/20 bg-card-bg p-6 space-y-6 shadow-xl animate-in fade-in-50 duration-300">
                  {/* Actions */}
                  {canEdit && selectedOrder.status.toLowerCase() === 'pending' && (
                    <div className="flex flex-col gap-4 p-5 rounded-xl bg-bg-soft/40 border border-primary/10">
                      <div className="font-battambang">
                        <h4 className="text-sm font-black text-text-main uppercase tracking-tight">សកម្មភាពគ្រប់គ្រង</h4>
                        <p className="text-[10px] font-bold text-text-dim/60 mt-0.5 uppercase tracking-widest leading-relaxed">កត់សម្គាល់ថាបានបង់ប្រាក់រួចរាល់ដើម្បីបញ្ចប់ការបញ្ជាទិញ</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          disabled={actionLoading === selectedOrder.id}
                          onClick={() => handleCancelOrder(selectedOrder.id)}
                          className="btn-secondary flex-1 justify-center !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20 text-xs"
                        >
                          <IconBan className="size-3.5" />
                          បោះបង់
                        </button>
                        <button
                          disabled={actionLoading === selectedOrder.id}
                          onClick={() => handleConfirmPayment(selectedOrder.id)}
                          className="btn-primary flex-1 justify-center text-xs"
                        >
                          <IconCheck className="size-3.5" />
                          បង់ប្រាក់រួចរាល់
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status.toLowerCase() === 'completed' && (
                    <div className="flex flex-col gap-4 p-5 rounded-xl bg-primary dark:bg-emerald-600 text-white shadow-md">
                      <div className="font-battambang">
                        <h4 className="text-sm font-black uppercase tracking-tight">ការបញ្ជាទិញត្រូវបានបំពេញ</h4>
                        <p className="text-[10px] font-bold text-white/70 mt-0.5 uppercase tracking-widest">វិក្កយបត្រត្រូវបានបង្កើតរួចរាល់</p>
                      </div>
                      <button
                        onClick={() => setSelectedOrderForInvoice(selectedOrder)}
                        className="btn-secondary justify-center !bg-white !text-zinc-900 shadow-none border-none h-9 text-xs font-battambang"
                      >
                        <IconFileText className="size-3.5" />
                        មើលវិក្កយបត្រ
                      </button>
                    </div>
                  )}

                  {/* Book Info */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dim/60 flex items-center gap-2 font-battambang">
                      <IconBooks className="size-3.5" /> ព័ត៌មានលម្អិតសៀវភៅ
                    </h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl bg-bg-soft/40 p-4 border border-grayborde/20 transition-all hover:border-primary/30">
                          <div className="flex items-center gap-3">
                            <div className="size-10 overflow-hidden rounded-lg bg-bg-soft flex items-center justify-center text-text-dim/40 border border-grayborde/20 flex-shrink-0">
                              {item.book_details?.image_url ? (
                                <img 
                                  src={formatImageUrl(item.book_details.image_url)} 
                                  alt={item.book_details.title} 
                                  className="size-full object-cover" 
                                />
                              ) : (
                                <IconBooks className="size-5" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-text-main leading-tight font-battambang">{item.book_details.title}</span>
                              <span className="text-[10px] font-bold text-text-dim/50 mt-0.5 uppercase tracking-wide">Qty: {item.quantity} units</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end font-battambang gap-1">
                            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">
                              {(parseFloat(item.price_at_purchase) * item.quantity * 4100).toLocaleString()}៛
                            </span>
                            <span className="text-xs font-black text-text-main/80">
                              ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping & Payment */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-xl bg-bg-soft/40 p-5 border border-grayborde/20">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dim/60 mb-3 flex items-center gap-2 font-battambang">
                        <IconTruck className="size-3.5" /> ព័ត៌មានដឹកជញ្ជូន
                      </h4>
                      <p className="text-xs font-bold text-text-main leading-relaxed font-battambang bg-card-bg p-3.5 rounded-xl border border-grayborde/40 shadow-sm">
                        {selectedOrder.shipping_address}
                      </p>

                      {selectedOrder.shipping_method && (
                        <div className="flex items-center justify-between mt-3 bg-card-bg p-3 rounded-xl border border-grayborde/40">
                          <div className="flex items-center gap-3">
                            <div className="size-10 overflow-hidden rounded-lg bg-bg-soft flex items-center justify-center text-text-dim/40 border border-grayborde/20 flex-shrink-0">
                              {getCarrierLogo(selectedOrder.shipping_method) ? (
                                <img src={getCarrierLogo(selectedOrder.shipping_method)!} alt={selectedOrder.shipping_method} className="size-full object-contain" />
                              ) : (
                                <IconTruck className="size-5" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-text-dim/40 mb-0.5 font-battambang">សេវាកម្មដឹកជញ្ជូន</span>
                              <span className="text-xs font-black text-text-main font-battambang">{selectedOrder.shipping_method}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-bg-soft/40 p-5 border border-grayborde/20">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dim/60 mb-3 flex items-center gap-2 font-battambang">
                        <IconCreditCard className="size-3.5" /> ព័ត៌មានទូទាត់ប្រាក់
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 overflow-hidden rounded-lg bg-bg-soft flex items-center justify-center text-text-dim/40 border border-grayborde/20 flex-shrink-0">
                            {selectedOrder.payment.payment_method.toUpperCase() === 'CASH' ? (
                              <IconCreditCard className="size-5" />
                            ) : (
                              <img src="/images/khqr.png" alt="KHQR" className="size-7 object-contain" />
                            )}
                          </div>
                          <span className={`text-xs font-black uppercase tracking-wide ${selectedOrder.payment.payment_method === 'Cash' ? "text-amber-600 dark:text-amber-400" : "text-text-main"} font-battambang`}>
                            {selectedOrder.payment.payment_method === 'Cash' ? "បង់ប្រាក់ពេលទទួលទំនិញ" : selectedOrder.payment.payment_method}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedOrder.payment.payment_status === 'Completed' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          } font-battambang`}>
                          {selectedOrder.payment.payment_status === 'Completed' ? "រួចរាល់" : "រង់ចាំ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-grayborde/40 bg-card-bg/20 border-dashed p-12 text-center text-text-dim/40 flex flex-col items-center justify-center h-[300px]">
                  <IconCart className="size-10 mb-3 opacity-30 text-text-dim/40 animate-pulse" />
                  <p className="text-xs font-battambang font-bold tracking-wide">សូមជ្រើសរើសការបញ្ជាទិញ ដើម្បីមើលព័ត៌មានលម្អិត</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Details Drawer/Modal */}
          <AnimatePresence>
            {expandedOrder && selectedOrder && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
              >
                {/* Overlay click to close */}
                <div className="absolute inset-0 z-0" onClick={() => setExpandedOrder(null)} />
                
                <motion.div
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="relative z-10 w-full max-w-lg bg-card-bg rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto border border-grayborde/40 flex flex-col gap-6"
                >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-grayborde/40 sticky top-0 bg-card-bg z-10 -mt-2 -mx-2 px-2 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-emerald-500">
                      <IconCart className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-dim/40 mb-0.5 font-battambang">ព័ត៌មានបញ្ជាទិញ</span>
                      <span className="text-sm font-black text-text-main leading-tight font-battambang">
                        {isAdmin ? selectedOrder.user_name || selectedOrder.user_email : `#${selectedOrder.id.toString().padStart(5, '0')}`}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setExpandedOrder(null)}
                    className="p-2 rounded-xl bg-bg-soft hover:bg-primary/10 text-text-dim hover:text-primary transition-all"
                  >
                    <IconX className="size-4.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Actions */}
                  {canEdit && selectedOrder.status.toLowerCase() === 'pending' && (
                    <div className="flex flex-col gap-4 p-5 rounded-xl bg-bg-soft/40 border border-primary/10">
                      <div className="font-battambang">
                        <h4 className="text-sm font-black text-text-main uppercase tracking-tight">សកម្មភាពគ្រប់គ្រង</h4>
                        <p className="text-[10px] font-bold text-text-dim/60 mt-0.5 uppercase tracking-widest leading-relaxed">កត់សម្គាល់ថាបានបង់ប្រាក់រួចរាល់ដើម្បីបញ្ចប់ការបញ្ជាទិញ</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          disabled={actionLoading === selectedOrder.id}
                          onClick={() => { handleCancelOrder(selectedOrder.id); setExpandedOrder(null); }}
                          className="btn-secondary flex-1 justify-center !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20 text-xs"
                        >
                          <IconBan className="size-3.5" />
                          បោះបង់
                        </button>
                        <button
                          disabled={actionLoading === selectedOrder.id}
                          onClick={() => { handleConfirmPayment(selectedOrder.id); setExpandedOrder(null); }}
                          className="btn-primary flex-1 justify-center text-xs"
                        >
                          <IconCheck className="size-3.5" />
                          បង់ប្រាក់រួចរាល់
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status.toLowerCase() === 'completed' && (
                    <div className="flex flex-col gap-4 p-5 rounded-xl bg-primary dark:bg-emerald-600 text-white shadow-md">
                      <div className="font-battambang">
                        <h4 className="text-sm font-black uppercase tracking-tight">ការបញ្ជាទិញត្រូវបានបំពេញ</h4>
                        <p className="text-[10px] font-bold text-white/70 mt-0.5 uppercase tracking-widest">វិក្កយបត្រត្រូវបានបង្កើតរួចរាល់</p>
                      </div>
                      <button
                        onClick={() => { setSelectedOrderForInvoice(selectedOrder); setExpandedOrder(null); }}
                        className="btn-secondary justify-center !bg-white !text-zinc-900 shadow-none border-none h-9 text-xs font-battambang"
                      >
                        <IconFileText className="size-3.5" />
                        មើលវិក្កយបត្រ
                      </button>
                    </div>
                  )}

                  {/* Book Info */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dim/60 flex items-center gap-2 font-battambang">
                      <IconBooks className="size-3.5" /> ព័ត៌មានលម្អិតសៀវភៅ
                    </h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl bg-bg-soft/40 p-4 border border-grayborde/20">
                          <div className="flex items-center gap-3">
                            <div className="size-10 overflow-hidden rounded-lg bg-bg-soft flex items-center justify-center text-text-dim/40 border border-grayborde/20 flex-shrink-0">
                              {item.book_details?.image_url ? (
                                <img 
                                  src={formatImageUrl(item.book_details.image_url)} 
                                  alt={item.book_details.title} 
                                  className="size-full object-cover" 
                                />
                              ) : (
                                <IconBooks className="size-5" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-text-main leading-tight font-battambang">{item.book_details.title}</span>
                              <span className="text-[10px] font-bold text-text-dim/50 mt-0.5 uppercase tracking-wide">Qty: {item.quantity} units</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end font-battambang gap-1">
                            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">
                              {(parseFloat(item.price_at_purchase) * item.quantity * 4100).toLocaleString()}៛
                            </span>
                            <span className="text-xs font-black text-text-main/80">
                              ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping & Payment */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-xl bg-bg-soft/40 p-5 border border-grayborde/20">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dim/60 mb-3 flex items-center gap-2 font-battambang">
                        <IconTruck className="size-3.5" /> ព័ត៌មានដឹកជញ្ជូន
                      </h4>
                      <p className="text-xs font-bold text-text-main leading-relaxed font-battambang bg-card-bg p-3.5 rounded-xl border border-grayborde/40 shadow-sm">
                        {selectedOrder.shipping_address}
                      </p>

                      {selectedOrder.shipping_method && (
                        <div className="flex items-center justify-between mt-3 bg-card-bg p-3 rounded-xl border border-grayborde/40">
                          <div className="flex items-center gap-3">
                            <div className="size-10 overflow-hidden rounded-lg bg-bg-soft flex items-center justify-center text-text-dim/40 border border-grayborde/20 flex-shrink-0">
                              {getCarrierLogo(selectedOrder.shipping_method) ? (
                                <img src={getCarrierLogo(selectedOrder.shipping_method)!} alt={selectedOrder.shipping_method} className="size-full object-contain" />
                              ) : (
                                <IconTruck className="size-5" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-text-dim/40 mb-0.5 font-battambang">សេវាកម្មដឹកជញ្ជូន</span>
                              <span className="text-xs font-black text-text-main font-battambang">{selectedOrder.shipping_method}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-bg-soft/40 p-5 border border-grayborde/20">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dim/60 mb-3 flex items-center gap-2 font-battambang">
                        <IconCreditCard className="size-3.5" /> ព័ត៌មានទូទាត់ប្រាក់
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 overflow-hidden rounded-lg bg-bg-soft flex items-center justify-center text-text-dim/40 border border-grayborde/20 flex-shrink-0">
                            {selectedOrder.payment.payment_method.toUpperCase() === 'CASH' ? (
                              <IconCreditCard className="size-5" />
                            ) : (
                              <img src="/images/khqr.png" alt="KHQR" className="size-7 object-contain" />
                            )}
                          </div>
                          <span className={`text-xs font-black uppercase tracking-wide ${selectedOrder.payment.payment_method === 'Cash' ? "text-amber-600 dark:text-amber-400" : "text-text-main"} font-battambang`}>
                            {selectedOrder.payment.payment_method === 'Cash' ? "បង់ប្រាក់ពេលទទួលទំនិញ" : selectedOrder.payment.payment_method}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedOrder.payment.payment_status === 'Completed' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          } font-battambang`}>
                          {selectedOrder.payment.payment_status === 'Completed' ? "រួចរាល់" : "រង់ចាំ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </>
        )}

        {selectedOrderForInvoice && (
          <InvoiceModal
            isOpen={!!selectedOrderForInvoice}
            onClose={() => setSelectedOrderForInvoice(null)}
            order={selectedOrderForInvoice as any}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
