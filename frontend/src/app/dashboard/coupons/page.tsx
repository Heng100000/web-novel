"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { apiClient } from "@/lib/api-client";
import { 
  IconTicket, 
  IconPlus, 
  IconTrash, 
  IconUsers, 
  IconCheck, 
  IconX,
  IconSearch,
  IconChevronDown
} from "../dashboard-icons";
import { useAuth } from "@/lib/auth-context";

export default function CouponsPage() {
  const { hasPermission } = useAuth();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "assignments">("list");
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCouponForAssign, setSelectedCouponForAssign] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkActionDropdownOpen, setIsBulkActionDropdownOpen] = useState(false);
  const bulkDropdownRef = useRef<HTMLDivElement>(null);
  
  // Delete Confirmation States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<"single" | "bulk" | "coupon">("single");

  useEffect(() => {
    fetchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(event.target as Node)) {
        setIsBulkActionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, ucRes, uRes]: any = await Promise.all([
        apiClient("/coupons/"),
        apiClient("/user-coupons/"),
        apiClient("/users/")
      ]);
      
      // Handle potential pagination (DRF returns { results: [] } if paginated)
      setCoupons(Array.isArray(cRes) ? cRes : cRes.results || []);
      setUserCoupons(Array.isArray(ucRes) ? ucRes : ucRes.results || []);
      setUsers(Array.isArray(uRes) ? uRes : uRes.results || []);
    } catch (err) {
      console.error("Failed to fetch coupon data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = (id: number) => {
    setItemToDelete(id);
    setDeleteType("coupon");
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUserCoupon = (id: number) => {
    setItemToDelete(id);
    setDeleteType("single");
    setIsDeleteModalOpen(true);
  };

  const handleToggleFreeze = async (uc: any) => {
    try {
      await apiClient(`/user-coupons/${uc.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !uc.is_active })
      });
      fetchData();
    } catch (err) {
      alert("បរាជ័យក្នុងការផ្លាស់ប្តូរស្ថានភាព");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === userCoupons.length && userCoupons.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(userCoupons.map(uc => uc.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setDeleteType("bulk");
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === "coupon") {
        await apiClient(`/coupons/${itemToDelete}/`, { method: "DELETE" });
      } else if (deleteType === "single") {
        await apiClient(`/user-coupons/${itemToDelete}/`, { method: "DELETE" });
      } else if (deleteType === "bulk") {
        await Promise.all(selectedIds.map(id => apiClient(`/user-coupons/${id}/`, { method: "DELETE" })));
        setSelectedIds([]);
      }
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err) {
      alert("បរាជ័យក្នុងការលុប");
    }
  };

  const handleBulkFreeze = async (freeze: boolean) => {
    const validIds = selectedIds.filter(id => {
      const uc = userCoupons.find(u => u.id === id);
      return uc && uc.coupon;
    });

    if (validIds.length === 0) {
      alert("មិនមានទិន្នន័យត្រឹមត្រូវសម្រាប់ផ្លាស់ប្តូរស្ថានភាពទេ (ប័ណ្ណអាចត្រូវបានលុប)");
      return;
    }

    try {
      await Promise.all(validIds.map(id => 
        apiClient(`/user-coupons/${id}/`, { 
          method: "PATCH", 
          body: JSON.stringify({ is_active: !freeze }) 
        })
      ));
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      alert("បរាជ័យក្នុងការផ្លាស់ប្តូរស្ថានភាពជាក្រុម");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-kantumruy">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card-bg p-8 rounded-2xl border border-grayborde shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl">
              <IconTicket className="size-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">ការគ្រប់គ្រងប័ណ្ណបញ្ចុះតម្លៃ</h1>
          </div>
          <p className="text-sm font-bold text-text-dim uppercase tracking-widest opacity-60">គ្រប់គ្រង និងបែងចែក Coupon ជូនដល់អតិថិជន</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            <IconPlus className="size-4" />
            បង្កើត Coupon ថ្មី
          </button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex gap-2 p-1.5 bg-bg-soft/50 rounded-2xl border border-grayborde w-fit">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            activeTab === "list" 
              ? "bg-card-bg text-primary shadow-sm ring-1 ring-grayborde" 
              : "text-text-dim hover:text-text-main"
          }`}
        >
          បញ្ជីប័ណ្ណ
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            activeTab === "assignments" 
              ? "bg-card-bg text-primary shadow-sm ring-1 ring-grayborde" 
              : "text-text-dim hover:text-text-main"
          }`}
        >
          ការផ្តល់ជូន
        </button>
      </div>

      {/* Bulk Action Bar */}
      {activeTab === "assignments" && selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-6 py-4 rounded-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-primary uppercase tracking-widest">ជ្រើសរើសបាន {selectedIds.length} នាក់</span>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-xs font-bold text-primary/60 hover:text-primary transition-colors underline"
            >
              បោះបង់
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={bulkDropdownRef}>
              <button 
                onClick={() => setIsBulkActionDropdownOpen(!isBulkActionDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-card-bg text-text-main rounded-xl text-[11px] font-black shadow-sm border border-grayborde hover:border-primary/50 transition-all"
              >
                <IconUsers className="size-4 text-primary" />
                ផ្លាស់ប្តូរស្ថានភាព
                <IconChevronDown className={`size-3 transition-transform duration-300 ${isBulkActionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBulkActionDropdownOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-56 bg-card-bg border border-grayborde rounded-2xl shadow-xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                  <div className="p-2 space-y-1">
                      <button 
                        disabled={selectedIds.filter(id => userCoupons.find(u => u.id === id)?.coupon).length === 0}
                        onClick={() => {
                          handleBulkFreeze(true);
                          setIsBulkActionDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-text-main hover:bg-primary/5 rounded-xl transition-all group disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                      >
                        <div className="p-2 bg-bg-soft group-hover:bg-primary/10 rounded-lg transition-colors">
                          <IconTicket className="size-4 text-text-dim group-hover:text-primary" />
                        </div>
                        បង្កកដែលបានជ្រើសរើស
                      </button>
                      <button 
                        disabled={selectedIds.filter(id => userCoupons.find(u => u.id === id)?.coupon).length === 0}
                        onClick={() => {
                          handleBulkFreeze(false);
                          setIsBulkActionDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-xl transition-all group disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                      >
                        <div className="p-2 bg-primary/10 group-hover:bg-primary/20 rounded-lg transition-colors">
                          <IconCheck className="size-4 text-primary" />
                        </div>
                        លែងបង្កកដែលបានជ្រើសរើស
                      </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[11px] font-black shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <IconTrash className="size-4" />
              លុបទាំងអស់
            </button>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === "list" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="group relative bg-card-bg p-6 rounded-2xl border border-grayborde hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <IconTicket className="size-6 text-primary" />
                  </div>
                  <button 
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="p-2 text-text-dim hover:text-red-500 transition-colors"
                  >
                    <IconTrash className="size-5" />
                  </button>
                </div>
                <h3 className="text-xl font-black text-text-main mb-1 uppercase tracking-tight">{coupon.code}</h3>
                <p className="text-sm font-bold text-text-dim mb-4 line-clamp-2">{coupon.description || "គ្មានការពិពណ៌នា"}</p>
                
                <div className="flex items-center justify-between p-4 bg-bg-soft/50 rounded-2xl border border-grayborde/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">បញ្ចុះតម្លៃ</span>
                    <span className="text-2xl font-black text-primary">{coupon.total_percentage}%</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedCouponForAssign(coupon);
                      setIsAssignModalOpen(true);
                    }}
                    className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                  >
                    <IconPlus className="size-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card-bg rounded-2xl border border-grayborde overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-soft/50 border-b border-grayborde">
                    <th className="px-8 py-5 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === userCoupons.length && userCoupons.length > 0}
                        onChange={toggleSelectAll}
                        className="size-4 rounded border-grayborde text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-5 text-xs font-black text-text-dim uppercase tracking-widest">អ្នកប្រើប្រាស់</th>
                    <th className="px-8 py-5 text-xs font-black text-text-dim uppercase tracking-widest">ប័ណ្ណ</th>
                     <th className="px-8 py-5 text-xs font-black text-text-dim uppercase tracking-widest text-center">ភាគរយនៅសល់</th>
                    <th className="px-8 py-5 text-xs font-black text-text-dim uppercase tracking-widest text-center">ស្ថានភាព</th>
                    <th className="px-8 py-5 text-xs font-black text-text-dim uppercase tracking-widest text-center">កាលបរិច្ឆេទ</th>
                    <th className="px-8 py-5 text-xs font-black text-text-dim uppercase tracking-widest text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grayborde">
                   {userCoupons.map((uc) => (
                    <tr key={uc.id} className={`hover:bg-bg-soft/30 transition-colors group ${
                      selectedIds.includes(uc.id) 
                        ? 'bg-primary/5' 
                        : !uc.is_active 
                          ? 'bg-red-50/60 dark:bg-red-950/20' 
                          : ''
                    }`}>
                      <td className="px-8 py-5">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(uc.id)}
                          onChange={() => toggleSelect(uc.id)}
                          className="size-4 rounded border-grayborde text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                            {uc.user_email ? uc.user_email[0].toUpperCase() : "U"}
                          </div>
                          <span className="text-sm font-bold text-text-main">{uc.user_email || "មិនស្គាល់អត្តសញ្ញាណ"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase">
                          <IconTicket className="size-3" />
                          {uc.coupon_code || uc.coupon_details?.code}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-black text-text-main">{parseFloat(uc.remaining_percentage).toFixed(0)}%</span>
                          <div className="w-16 h-1.5 bg-bg-soft rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${uc.remaining_percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    <td className="px-8 py-5 text-center">
                      {uc.is_used_up ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase border border-red-100 dark:border-red-900/20">
                          <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                          ប្រើអស់ហើយ
                        </span>
                      ) : !uc.is_active ? (
                        <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/40">បានបង្កក</span>
                      ) : (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">កំពុងប្រើ</span>
                      )}
                    </td>
                       <td className="px-8 py-5 text-center text-xs font-bold text-text-dim">
                        {new Date(uc.assigned_at).toLocaleDateString("km-KH")}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-all">
                            <button 
                              disabled={!uc.coupon}
                              onClick={() => handleToggleFreeze(uc)}
                              title={!uc.coupon ? "មិនអាចដំណើរការបានទេ (ប័ណ្ណត្រូវបានលុប)" : uc.is_active ? "បង្កក" : "លែងបង្កក"}
                              className={`p-2 rounded-xl transition-all border shadow-sm ${
                                !uc.coupon
                                  ? "opacity-30 cursor-not-allowed grayscale bg-bg-soft/40 border-grayborde"
                                  : uc.is_active 
                                    ? "text-text-dim bg-bg-soft/40 border-grayborde hover:text-primary hover:border-primary/30 hover:bg-primary/5" 
                                    : "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20 hover:border-primary/40"
                              }`}
                            >
                              <IconTicket className="size-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUserCoupon(uc.id)}
                              title="លុប"
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                            >
                              <IconTrash className="size-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && createPortal(
        <CreateCouponModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchData();
          }} 
        />,
        document.body
      )}

      {isAssignModalOpen && createPortal(
        <AssignCouponModal 
          selectedCoupon={selectedCouponForAssign}
          users={users}
          onClose={() => setIsAssignModalOpen(false)} 
          onSuccess={() => {
            setIsAssignModalOpen(false);
            fetchData();
          }} 
        />,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-card-bg rounded-3xl border border-grayborde shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="mx-auto size-20 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center mb-6">
                <IconTrash className="size-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-text-main mb-3 uppercase tracking-tight">
                បញ្ជាក់ការលុប
              </h3>
              <p className="text-text-dim font-bold leading-relaxed mb-8">
                {deleteType === "bulk" 
                  ? `តើអ្នកប្រាកដថាចង់លុបទិន្នន័យទាំង ${selectedIds.length} នេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ថយក្រោយវិញបានទេ។`
                  : "តើអ្នកប្រាកដថាចង់លុបទិន្នន័យនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ថយក្រោយវិញបានទេ។"
                }
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-4 bg-bg-soft text-text-main rounded-2xl font-black text-sm hover:bg-grayborde transition-all active:scale-95"
                >
                  បោះបង់
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-6 py-4 bg-red-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-500/20 hover:bg-red-600 hover:scale-105 active:scale-95 transition-all"
                >
                  យល់ព្រមលុប
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Internal Modal Components

function CreateCouponModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    total_percentage: 10,
    start_date: null,
    end_date: null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    // Provide default dates if not provided to satisfy DB constraints
    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);

    const cleanedData = {
      ...formData,
      start_date: formData.start_date || now.toISOString(),
      end_date: formData.end_date || oneYearLater.toISOString()
    };

    try {
      await apiClient("/coupons/", {
        method: "POST",
        body: JSON.stringify(cleanedData)
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card-bg w-full max-w-lg rounded-3xl border border-grayborde shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 font-kantumruy">
        <div className="p-8 border-b border-grayborde bg-bg-soft/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">បង្កើតប័ណ្ណថ្មី</h2>
            <button onClick={onClose} className="p-2 hover:bg-bg-soft rounded-xl transition-colors"><IconX className="size-6" /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-main px-1">កូដប័ណ្ណ (COUPON CODE)</label>
            <input 
              type="text" 
              required
              placeholder="ឧទាហរណ៍៖ WELCOME2026"
              className="input-standard uppercase"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-main px-1">ភាគរយបញ្ចុះតម្លៃ (%)</label>
            <input 
              type="number" 
              required
              min="1"
              max="100"
              className="input-standard"
              value={formData.total_percentage}
              onChange={(e) => setFormData({...formData, total_percentage: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-main px-1">ការពិពណ៌នា</label>
            <textarea 
              rows={3}
              className="input-standard resize-none h-auto py-3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full h-14 rounded-2xl text-lg"
          >
            {loading ? "កំពុងរក្សាទុក..." : "រក្សាទុកប័ណ្ណ"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AssignCouponModal({ users, selectedCoupon, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    users: [] as number[],
    coupon: selectedCoupon?.id || "",
    remaining_percentage: selectedCoupon?.total_percentage || 0
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter((u: any) => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      users: prev.users.includes(userId) 
        ? prev.users.filter(id => id !== userId) 
        : [...prev.users, userId]
    }));
  };

  const selectedUsersData = users.filter((u: any) => formData.users.includes(u.id));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (formData.users.length === 0 || !formData.coupon) {
      alert("សូមជ្រើសរើសអ្នកប្រើប្រាស់យ៉ាងហោចណាស់ម្នាក់ និងជ្រើសរើសប័ណ្ណ");
      return;
    }
    setLoading(true);
    try {
      await apiClient("/user-coupons/bulk_assign/", {
        method: "POST",
        body: JSON.stringify({
          user_ids: formData.users,
          coupon_id: formData.coupon,
          remaining_percentage: formData.remaining_percentage
        })
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to assign coupon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card-bg w-full max-w-lg rounded-3xl border border-grayborde shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 font-kantumruy">
        <div className="p-8 border-b border-grayborde bg-bg-soft/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">ផ្តល់ប័ណ្ណឱ្យអ្នកប្រើប្រាស់</h2>
            <button onClick={onClose} className="p-2 hover:bg-bg-soft rounded-xl transition-colors"><IconX className="size-6" /></button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-sm font-bold text-text-main px-1">ជ្រើសរើសអ្នកប្រើប្រាស់ ({formData.users.length})</label>
              
              {/* Trigger */}
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`input-standard cursor-pointer flex items-center justify-between min-h-[48px] py-2 ${isDropdownOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {selectedUsersData.length === 0 ? (
                    <span className="text-text-dim opacity-40 font-bold">ចុចដើម្បីជ្រើសរើសអ្នកប្រើប្រាស់...</span>
                  ) : (
                    selectedUsersData.slice(0, 2).map((u: any) => (
                      <span key={u.id} className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1">
                        {u.full_name}
                        <button onClick={(e) => { e.stopPropagation(); toggleUser(u.id); }} className="hover:text-red-500"><IconX className="size-3" /></button>
                      </span>
                    ))
                  )}
                  {selectedUsersData.length > 2 && (
                    <span className="text-[10px] font-black text-text-dim px-1">+{selectedUsersData.length - 2} នាក់ទៀត</span>
                  )}
                </div>
                <IconChevronDown className={`size-4 text-text-dim transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card-bg border border-grayborde rounded-xl shadow-2xl z-[210] animate-in slide-in-from-top-2 duration-300 overflow-hidden">
                  <div className="p-3 border-b border-grayborde bg-bg-soft/30">
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-dim" />
                      <input 
                        autoFocus
                        type="text"
                        placeholder="ស្វែងរកតាមឈ្មោះ ឬ អ៊ីមែល..."
                        className="w-full h-10 rounded-lg border border-grayborde bg-white pl-10 pr-4 text-xs font-bold focus:border-primary outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto p-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = users.map((u: any) => u.id);
                        setFormData({...formData, users: formData.users.length === users.length ? [] : allIds});
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-bg-soft text-left group"
                    >
                      <span className="text-[11px] font-black text-primary uppercase tracking-widest px-1">ជ្រើសរើសទាំងអស់</span>
                      <div className={`size-4 rounded border flex items-center justify-center transition-all ${
                        formData.users.length === users.length ? "bg-primary border-primary text-white" : "border-grayborde"
                      }`}>
                        {formData.users.length === users.length && <IconCheck className="size-2.5" />}
                      </div>
                    </button>
                    <div className="h-px bg-grayborde mx-1 my-1 opacity-50" />
                    {filteredUsers.map((u: any) => {
                      const isSelected = formData.users.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUser(u.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
                            isSelected ? "bg-primary/5" : "hover:bg-bg-soft"
                          }`}
                        >
                          <div className="flex flex-col text-left">
                            <span className={`text-xs font-bold ${isSelected ? "text-primary" : "text-text-main"}`}>{u.full_name || "មិនស្គាល់ឈ្មោះ"}</span>
                            <span className="text-[9px] font-medium text-text-dim">{u.email}</span>
                          </div>
                          <div className={`size-4 rounded border flex items-center justify-center transition-all ${
                            isSelected ? "bg-primary border-primary text-white" : "border-grayborde"
                          }`}>
                            {isSelected && <IconCheck className="size-2.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main px-1">ប័ណ្ណសម្រាប់ការផ្តល់ជូន</label>
              <div className="input-standard bg-bg-soft/50 flex items-center px-4 font-black text-primary uppercase">
                {selectedCoupon?.code} ({selectedCoupon?.total_percentage}%)
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main px-1">ភាគរយដែលត្រូវផ្តល់ឱ្យ (%)</label>
              <input 
                type="number" 
                required
                className="input-standard"
                value={formData.remaining_percentage}
                onChange={(e) => setFormData({...formData, remaining_percentage: parseInt(e.target.value)})}
              />
              <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest px-1 opacity-60">អ្នកអាចប្តូរចំនួននេះបាន ប្រសិនបើចង់ឱ្យលើស ឬខ្វះពីចំនួនដើម</p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || formData.users.length === 0}
            className="btn-primary w-full h-14 rounded-xl text-lg shadow-lg shadow-primary/20"
          >
            {loading ? "កំពុងបញ្ជូន..." : `ផ្តល់ជូនឥឡូវនេះ (${formData.users.length} នាក់)`}
          </button>
        </form>
      </div>
    </div>
  );
}
