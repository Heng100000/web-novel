"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { 
  IconCart, IconChevronDown, IconCheck, IconTruck, 
  IconCreditCard, IconBooks, IconTrendingUp, 
  IconAlertCircle, IconUserCheck, IconBan, IconFileText
} from "../dashboard-icons";
import { InvoiceModal } from "../_components/invoice-modal";
import { formatDate } from "@/lib/utils";
import { PermissionGuard } from "../_components/permission-guard";

interface OrderItem {
  id: number;
  book_details: {
    title: string;
    price: string;
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
  items: OrderItem[];
  user_email?: string;
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
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className={`group overflow-hidden rounded-2xl border border-grayborde bg-card-bg transition-all ${
                  expandedOrder === order.id ? "shadow-2xl ring-1 ring-primary/10" : "shadow-md hover:shadow-lg"
                }`}
              >
                <div 
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="flex cursor-pointer items-center justify-between p-6 gap-6"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-text-dim/40 mb-1 font-battambang">
                        {isAdmin ? "អតិថិជន" : "លេខបញ្ជាទិញ"}
                      </span>
                      <span className="text-sm font-black text-text-main leading-none">
                        {isAdmin ? order.user_email || `User #${order.id}` : `#${order.id.toString().padStart(5, '0')}`}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-grayborde/40" />
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-text-dim/40 mb-1 font-battambang">កាលបរិច្ឆេទ</span>
                      <span className="text-xs font-bold text-text-dim/80 leading-none">{formatDate(order.order_date)}</span>
                    </div>
                    <div className="h-8 w-px bg-grayborde/40" />
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-text-dim/40 mb-1 font-battambang">ចំនួនទឹកប្រាក់</span>
                      <span className="text-sm font-black text-primary dark:text-emerald-500 leading-none">${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ring-1 ${getStatusStyle(order.status)} font-battambang flex-nowrap`}>
                      {getStatusLabel(order.status)}
                    </span>
                    
                    <div className={`p-2 rounded-lg transition-all ${expandedOrder === order.id ? "bg-primary/10 text-primary dark:text-emerald-500 rotate-180" : "bg-bg-soft text-text-dim/60"}`}>
                      <IconChevronDown className="size-4" />
                    </div>
                  </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out ${
                  expandedOrder === order.id ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                }`}>
                  <div className="border-t border-grayborde/40 bg-bg-soft/20 p-8 space-y-8">
                    {/* Actions */}
                    {canEdit && order.status.toLowerCase() === 'pending' && (
                      <div className="flex items-center gap-4 p-6 rounded-2xl bg-card-bg border border-primary/10 shadow-sm animate-in zoom-in-95 duration-300">
                         <div className="flex-1 font-battambang">
                            <h4 className="text-sm font-black text-text-main uppercase tracking-tight">សកម្មភាពគ្រប់គ្រង</h4>
                            <p className="text-[10px] font-bold text-text-dim/60 mt-0.5 uppercase tracking-widest">កត់សម្គាល់ថាបានបង់ប្រាក់រួចរាល់ដើម្បីបញ្ចប់ការបញ្ជាទិញ</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <button 
                              disabled={actionLoading === order.id}
                              onClick={() => handleCancelOrder(order.id)}
                              className="btn-secondary !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20"
                            >
                               <IconBan className="size-3.5" />
                               បោះបង់
                            </button>
                            <button 
                              disabled={actionLoading === order.id}
                              onClick={() => handleConfirmPayment(order.id)}
                              className="btn-primary"
                            >
                               <IconCheck className="size-3.5" />
                               បង់ប្រាក់រួចរាល់
                            </button>
                         </div>
                      </div>
                    )}

                    {order.status.toLowerCase() === 'completed' && (
                      <div className="flex items-center gap-4 p-6 rounded-3xl bg-primary dark:bg-emerald-600 text-white shadow-xl animate-in zoom-in-95 duration-300">
                         <div className="flex-1 font-battambang">
                            <h4 className="text-sm font-black uppercase tracking-tight">ការបញ្ជាទិញត្រូវបានបំពេញ</h4>
                            <p className="text-[10px] font-bold text-white/70 mt-0.5 uppercase tracking-widest">វិក្កយបត្រត្រូវបានបង្កើតរួចរាល់</p>
                         </div>
                         <button 
                           onClick={() => setSelectedOrderForInvoice(order)}
                           className="btn-secondary !bg-white !text-zinc-900 shadow-none border-none h-9 text-[10px]"
                         >
                            <IconFileText className="size-3.5" />
                            មើលវិក្កយបត្រ
                         </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dim/60 mb-4 flex items-center gap-2 font-battambang">
                            <IconBooks className="size-3.5" /> ព័ត៌មានលម្អិតសៀវភៅ
                         </h4>
                         <div className="space-y-3">
                            {order.items.map((item) => (
                               <div key={item.id} className="flex items-center justify-between rounded-2xl bg-card-bg p-4 shadow-sm ring-1 ring-border-dim/5 transition-all hover:ring-primary/30">
                                  <div className="flex items-center gap-3">
                                     <div className="size-8 rounded-lg bg-bg-soft flex items-center justify-center text-text-dim/40">
                                        <IconBooks className="size-4" />
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-xs font-black text-text-main leading-tight font-battambang">{item.book_details.title}</span>
                                        <span className="text-[10px] font-bold text-text-dim/50 mt-0.5 uppercase tracking-wide">Qty: {item.quantity} units</span>
                                     </div>
                                  </div>
                                  <span className="text-xs font-black text-text-main font-battambang">${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="rounded-3xl bg-card-bg p-6 shadow-sm ring-1 ring-border-dim/5">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dim/60 mb-4 flex items-center gap-2 font-battambang">
                               <IconTruck className="size-3.5" /> ព័ត៌មានដឹកជញ្ជូន
                            </h4>
                            <p className="text-xs font-bold text-text-dim/80 leading-relaxed bg-bg-soft/50 p-4 rounded-2xl border border-grayborde/40 font-battambang">
                               {order.shipping_address}
                            </p>
                         </div>

                         <div className="rounded-3xl bg-card-bg p-6 shadow-sm ring-1 ring-border-dim/5">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-text-dim/60 mb-4 flex items-center gap-2 font-battambang">
                               <IconCreditCard className="size-3.5" /> ព័ត៌មានទូទាត់ប្រាក់
                            </h4>
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-lg bg-bg-soft flex items-center justify-center text-text-dim/40">
                                     <IconCreditCard className="size-4" />
                                  </div>
                                  <span className={`text-xs font-black uppercase tracking-wide ${order.payment.payment_method === 'Cash' ? "text-amber-600 dark:text-amber-400" : "text-text-main"} font-battambang`}>
                                     {order.payment.payment_method === 'Cash' ? "បង់ប្រាក់ពេលទទួលទំនិញ" : order.payment.payment_method}
                                  </span>
                               </div>
                               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  order.payment.payment_status === 'Completed' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                               } font-battambang`}>
                                  {order.payment.payment_status === 'Completed' ? "រួចរាល់" : "រង់ចាំ"}
                               </span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
