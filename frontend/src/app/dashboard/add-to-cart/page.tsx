"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { IconOrders, IconBooks, IconPlus, IconPen, IconTrash } from "../dashboard-icons";
import Link from "next/link";
import { Modal } from "../_components/modal";
import { AddToCartForm } from "../_components/forms/add-to-cart-form";
import { CheckoutModal } from "../_components/checkout-modal";
import { IconTruck } from "../dashboard-icons";
import { PermissionGuard } from "../_components/permission-guard";
import { formatImageUrl } from "@/lib/utils";

interface CartEntry {
  id: number;
  user: number;
  book: number;
  user_details?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
  book_details: {
    title: string;
    price: string;
    discounted_price: string | number;
    image_url?: string;
  };
  quantity: number;
  batch_id: string | null;
  created_at: string;
}

interface CartGroup {
  batch_id: string;
  created_at: string;
  items: CartEntry[];
  grandTotal: number;
  user?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export default function AddToCartListPage() {
  const { hasPermission } = useAuth();
  const [groups, setGroups] = useState<CartGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutGroup, setCheckoutGroup] = useState<CartGroup | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Permission checks
  const canCreate = hasPermission('cart', 'can_create');
  const canEdit = hasPermission('cart', 'can_edit');
  const canDelete = hasPermission('cart', 'can_delete');
  const canCheckout = hasPermission('orders', 'can_create');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient<CartEntry[]>("/add-to-cart/");
      const entries = Array.isArray(response) ? response : (response as any).results || [];
      
      // Group by batch_id
      const grouped: Record<string, CartEntry[]> = {};
      entries.forEach((entry: CartEntry) => {
        const bid = entry.batch_id || `single-${entry.id}`;
        if (!grouped[bid]) grouped[bid] = [];
        grouped[bid].push(entry);
      });

      // Transform to Array of Groups
      const cartGroups: CartGroup[] = Object.entries(grouped).map(([bid, items]) => {
        const total = items.reduce((sum, item) => {
          const price = parseFloat(item.book_details?.discounted_price?.toString() || item.book_details?.price || "0");
          return sum + (price * item.quantity);
        }, 0);

        return {
          batch_id: bid,
          created_at: items[0].created_at,
          items,
          grandTotal: total,
          user: items[0].user_details
        };
      });

      // Sort by date newest first
      setGroups(cartGroups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.error("Failed to fetch cart entries", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm("តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?")) return;
    try {
      await apiClient(`/add-to-cart/${id}/`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete cart entry", err);
    }
  };

  return (
    <PermissionGuard resource="cart">
      <div className="flex flex-col gap-8 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#3f6815]/5 text-[#3f6815] ring-1 ring-[#3f6815]/10">
              <IconOrders className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-text-main font-battambang">បញ្ជីតាមដានកញ្ចប់ទំនិញ</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 font-battambang">គ្រប់គ្រង និងតាមដានសៀវភៅដែលបានកក់ដើម្បីបោះពុម្ភវិក្កយបត្រ</p>
            </div>
          </div>
          
          {canCreate && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
            >
              <IconPlus className="size-4" />
              <span>បន្ថែមទិន្នន័យថ្មី</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 w-full animate-pulse rounded-xl bg-bg-soft/50" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-grayborde bg-bg-soft/10">
            <div className="size-16 rounded-xl bg-bg-soft flex items-center justify-center text-text-dim/40 mb-4">
              <IconOrders className="size-8" />
            </div>
            <p className="text-sm font-black text-text-dim/60 uppercase tracking-widest font-battambang text-center">មិនមានទិន្នន័យក្នុងកញ្ចប់ទំនិញទេ</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {groups.map((group) => (
              <div key={group.batch_id} className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full border-2 border-[#3f6815]/10 overflow-hidden bg-zinc-100 ring-2 ring-white shadow-sm">
                      {group.user?.avatar_url ? (
                        <img src={group.user.avatar_url} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                           <IconPlus className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-text-main font-battambang">{group.user?.full_name || 'អតិថិជន'}</span>
                      <span className="text-[10px] font-bold text-text-dim/60">{group.user?.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3f6815] bg-[#3f6815]/5 px-3 py-1 rounded-full font-battambang">
                      ក្រុម៖ {group.batch_id.startsWith('single-') ? 'ដាច់ដោយឡែក' : group.batch_id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] font-bold text-text-dim/60 font-battambang">
                      {new Date(group.created_at).toLocaleDateString('km-KH')} {new Date(group.created_at).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-grayborde bg-card-bg shadow-md ring-1 ring-border-dim/5 transition-all hover:shadow-lg">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-grayborde bg-bg-soft/10 text-xs font-black uppercase tracking-widest text-text-dim/60 font-battambang">
                        <th className="px-6 py-4">ផលិតផល / សៀវភៅរឿង</th>
                        <th className="px-6 py-4 text-center">តម្លៃរាយ</th>
                        <th className="px-6 py-4 text-center">ចំនួន</th>
                        <th className="px-6 py-4 text-right">សរុបរង</th>
                        <th className="px-6 py-4 text-right">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-grayborde/20">
                      {group.items.map((item) => {
                        const unitPrice = parseFloat(item.book_details?.discounted_price?.toString() || item.book_details?.price || "0");
                        const subtotal = unitPrice * item.quantity;
                        
                        return (
                          <tr key={item.id} className="group transition-colors hover:bg-bg-soft/10">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-bg-soft text-text-dim/40 group-hover:bg-[#3f6815]/10 group-hover:text-[#3f6815] transition-all overflow-hidden border border-grayborde/20">
                                  {item.book_details?.image_url ? (
                                    <img 
                                      src={formatImageUrl(item.book_details.image_url)} 
                                      alt={item.book_details.title} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <IconBooks className="size-5" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-text-main leading-tight font-battambang">{item.book_details?.title}</span>
                                  <span className="text-[10px] font-bold text-text-dim/50 mt-0.5 uppercase tracking-wide">កូដសៀវភៅ: #{item.book}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-sm font-bold text-text-dim">${unitPrice.toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="inline-flex rounded-lg bg-bg-soft px-3 py-1.5 text-[11px] font-black text-text-dim/70 ring-1 ring-grayborde/50 font-battambang">
                                {item.quantity} ច្បាប់
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <span className="text-sm font-black text-text-main">${subtotal.toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-5 text-right">
                               <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                  {canEdit && (
                                    <Link 
                                      href={`/dashboard/add-to-cart/edit/${item.id}`}
                                      className="flex size-9 items-center justify-center rounded-xl text-text-dim/40 hover:bg-[#3f6815]/10 hover:text-[#3f6815] transition-all"
                                    >
                                      <IconPen className="size-4" />
                                    </Link>
                                  )}
                                  {canDelete && (
                                    <button 
                                      onClick={() => handleDelete(item.id)}
                                      className="flex size-9 items-center justify-center rounded-xl text-text-dim/40 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 transition-all"
                                    >
                                      <IconTrash className="size-4" />
                                    </button>
                                  )}
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-bg-soft/10 border-t border-grayborde/40 font-battambang">
                        <td colSpan={2} className="px-6 py-6 text-left">
                          {canCheckout && (
                            <button
                              onClick={() => {
                                setCheckoutGroup(group);
                                setIsCheckoutOpen(true);
                              }}
                              className="btn-primary"
                            >
                              <IconTruck className="size-3.5" />
                              ទូទាត់ប្រាក់ឥឡូវនេះ
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex flex-col items-end font-battambang">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim/40 mb-1">សេចក្តីសង្ខេប</span>
                             <span className="text-xs font-black text-text-main uppercase">តម្លៃសរុបរួម</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <span className="text-2xl font-black text-[#3f6815] tracking-tight">
                            ${group.grandTotal.toFixed(2)}
                          </span>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="បន្ថែមទិន្នន័យកញ្ចប់ទំនិញថ្មី"
        >
          <AddToCartForm 
            onSuccess={() => {
              setIsModalOpen(false);
              fetchData();
            }} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </Modal>

        <Modal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          title="ការទូទាត់ប្រាក់សម្រាប់ការបញ្ជាទិញ"
          size="6xl"
        >
          {checkoutGroup && (
            <CheckoutModal 
              batchId={checkoutGroup.batch_id}
              items={checkoutGroup.items}
              total={checkoutGroup.grandTotal}
              onSuccess={() => {
                setIsCheckoutOpen(false);
                fetchData();
              }}
              onCancel={() => setIsCheckoutOpen(false)}
            />
          )}
        </Modal>
      </div>
    </PermissionGuard>
  );
}
