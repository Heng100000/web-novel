import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Modal } from "./modal";
import { IconChevronLeft, IconChevronRight, IconPlus, IconSearch, IconFilter, IconPen, IconTrash, IconShield } from "../dashboard-icons";
import { CustomSelect } from "./custom-select";

interface ResourceTableProps<T> {
  icon?: any;
  title: string;
  endpoint: string;
  columns: {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
  }[];
  addNewLabel: string;
  createRoute?: string;
  AddFormComponent?: React.ComponentType<{ 
    onSuccess: () => void; 
    onCancel: () => void;
  }>;
  onRowClick?: (item: T) => void;
  resourceKey?: string;
}

export function ResourceTable<T extends { id: number | string }>({
  icon: Icon,
  title,
  endpoint,
  columns,
  addNewLabel,
  createRoute,
  AddFormComponent,
  onRowClick,
  resourceKey,
}: ResourceTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const { user, isAdmin, hasPermission } = useAuth();
  const router = useRouter();

  // TEMPORARILY DISABLED: Always allow all actions
  const canView = true;
  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const handleEdit = (id: number | string) => {
    const currentPath = window.location.pathname;
    router.push(`${currentPath}/edit/${id}`);
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const separator = endpoint.includes("?") ? "&" : "?";
    let pagedUrl = `${endpoint}${separator}page=${currentPage}&page_size=${pageSize}`;
    
    if (debouncedSearch) {
      pagedUrl += `&search=${encodeURIComponent(debouncedSearch)}`;
    }
    
    apiClient<{ results: T[], count: number } | T[]>(pagedUrl)
      .then((res) => {
        if (Array.isArray(res)) {
          setData(res);
          setTotalRows(res.length);
        } else {
          setData(res.results);
          setTotalRows(res.count);
        }
        setLoading(false);
        setSelectedIds(new Set()); // Reset selection on data fetch
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        setSelectedIds(new Set());
      });
  }, [endpoint, currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    // Reset to first page when switching resources (e.g., from Books to Authors)
    setCurrentPage(1);
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    fetchData();
  };

  const toggleRow = (id: number | string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length && data.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(item => item.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    // User confirmation
    if (!confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យទាំង ${selectedIds.size} នេះមែនទេ?`)) return;

    setLoading(true);
    try {
      // In a real app, you might have a bulk delete endpoint. 
      // For now, we perform sequential deletes.
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await apiClient(`${endpoint.split('?')[0]}${id}/`, { method: "DELETE" });
      }
      setSelectedIds(new Set());
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to perform bulk delete");
      setLoading(false);
    }
  };

  if (!canView) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center bg-card-bg rounded-2xl border border-grayborde shadow-sm">
        <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-xl ring-1 ring-red-500/20">
          <IconShield className="size-10" />
        </div>
        <h2 className="text-2xl font-black text-text-main font-battambang uppercase tracking-tight">សិទ្ធិចូលប្រើប្រាស់ត្រូវបានបដិសេធ</h2>
        <p className="mt-2 max-w-md text-sm font-bold text-text-dim/60 font-battambang uppercase tracking-widest leading-relaxed">
          លោកអ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់ដើម្បីចូលមើលទិន្នន័យក្នុងផ្នែក "{title}" នេះទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin) ដើម្បីសាកសួរព័ត៌មានបន្ថែម។
        </p>
        <button 
          onClick={() => router.push("/dashboard")}
          className="btn-primary mt-8"
        >
          ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រងវិញ
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/5 dark:bg-emerald-500/10 text-primary dark:text-emerald-500 ring-1 ring-primary/10 dark:ring-emerald-500/20">
              <Icon className="size-4.5" />
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight text-text-main uppercase font-battambang">{title}</h2>
            <p className="text-xs font-bold text-text-dim/60 uppercase tracking-widest mt-1 font-battambang">គ្រប់គ្រងធនធានបណ្ណាល័យរបស់អ្នកដោយប្រសិទ្ធភាព</p>
          </div>
        </div>
        
        {canCreate && (
          createRoute ? (
            <Link
              href={createRoute}
              className="btn-primary"
            >
              <IconPlus className="size-3.5" />
              <span>{addNewLabel}</span>
            </Link>
          ) : (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
            >
              <IconPlus className="size-3.5" />
              <span>{addNewLabel}</span>
            </button>
          )
        )}
      </div>

      <div className="rounded-xl border border-grayborde bg-card-bg shadow-[var(--filament-shadow-sm)] overflow-hidden transition-all duration-300">
        {/* Table Action Bar */}
        <div className="flex items-center justify-between border-b border-grayborde bg-bg-soft/50 px-4 py-3">
           <div className="relative w-72 group">
              <div className="flex h-9 w-full items-center overflow-hidden rounded-lg border border-grayborde bg-input-bg transition-all focus-within:border-primary dark:focus-within:border-emerald-500">
                <div className="flex aspect-square h-full items-center justify-center border-r border-grayborde/80 px-2.5 text-text-dim group-focus-within:text-primary dark:group-focus-within:text-emerald-500">
                  <IconSearch className="size-3.5" />
                </div>
                <input 
                  type="text" 
                  placeholder="ស្វែងរកទិន្នន័យ..."
                  className="h-full w-full bg-transparent px-3 text-xs font-bold text-text-main outline-none placeholder:text-text-dim/60 placeholder:font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button className="flex size-8 items-center justify-center rounded-md border border-grayborde bg-card-bg text-text-dim hover:text-primary dark:hover:text-emerald-500 hover:bg-bg-soft transition-all">
                 <IconFilter className="size-3.5" />
              </button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-grayborde bg-bg-soft/50 text-[13px] font-black uppercase tracking-widest text-text-dim">
                <th className="pl-6 pr-0 py-3.5 w-10">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="size-4.5 rounded-md border-grayborde dark:border-primary/50 bg-card-bg accent-primary text-primary focus:ring-0 transition-all cursor-pointer"
                      checked={data.length > 0 && selectedIds.size === data.length}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-3.5 font-battambang">{col.header}</th>
                ))}
                <th className="px-6 py-3.5 text-right font-battambang">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grayborde">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    {columns.map((_, i) => (
                      <td key={i} className="px-6 py-6">
                        <div className="h-4 w-2/3 rounded-lg bg-bg-soft/50" />
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      <div className="ml-auto h-4 w-12 rounded-lg bg-bg-soft/50" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-16 text-center text-sm text-red-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                       <div className="size-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <span className="mt-2 text-text-main font-battambang">មានកំហុសក្នុងការទាញយកទិន្នន័យ</span>
                      <p className="text-xs text-text-dim">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-16 rounded-2xl bg-bg-soft flex items-center justify-center text-text-dim/30">
                        {Icon ? <Icon className="size-8" /> : <div className="size-8 rounded-lg bg-current" />}
                      </div>
                      <div className="text-sm font-bold text-text-main font-battambang">មិនមានទិន្នន័យ</div>
                      <p className="text-xs text-text-dim">សូមចាប់ផ្ដើមដោយបង្កើតទិន្នន័យ {title} ដំបូងរបស់អ្នក។</p>
                    </div>
                  </td>
                </tr>
              ) : (
                 data.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => onRowClick?.(item)}
                    className={`group transition-all hover:bg-bg-soft/50 ${onRowClick ? "cursor-pointer" : "cursor-default"} ${selectedIds.has(item.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="pl-6 pr-0 py-3.5 w-10">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="size-4.5 rounded-md border-grayborde dark:border-primary/50 bg-card-bg accent-primary text-primary focus:ring-0 transition-all cursor-pointer"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleRow(item.id)}
                        />
                      </div>
                    </td>
                    {columns.map((col, i) => (
                      <td key={i} className="px-6 py-3.5 text-[13px] font-semibold text-text-main transition-colors group-hover:text-primary dark:group-hover:text-emerald-500">
                        {typeof col.accessor === "function" 
                          ? col.accessor(item) 
                          : (item[col.accessor] as React.ReactNode)}
                      </td>
                    ))}
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 px-1">
                        {canEdit && (
                          <button 
                            onClick={() => handleEdit(item.id)}
                            className="flex size-8 items-center justify-center rounded-md text-text-dim hover:bg-primary/10 hover:text-primary dark:hover:text-emerald-500 transition-all active:scale-90"
                            title="កែប្រែ"
                          >
                            <IconPen className="size-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="flex size-8 items-center justify-center rounded-md text-text-dim hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-90"
                            title="លុប"
                          >
                            <IconTrash className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={addNewLabel}
      >
        {AddFormComponent && (
          <AddFormComponent 
            onSuccess={handleCreateSuccess} 
            onCancel={() => setIsModalOpen(false)} 
          />
        )}
      </Modal>

      {/* Pagination Footer */}
      {!loading && !error && data.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-6 px-1 py-1 sm:flex-row transition-all">
          {/* Left: Range Info */}
          <div className="flex-1 text-left hidden sm:block">
            <p className="text-[13px] font-bold text-text-dim">
              បង្ហាញ <span className="text-text-main font-black">{((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalRows)}</span> ក្នុងចំណោម <span className="text-text-main font-black">{totalRows}</span>
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center gap-3">
             <CustomSelect
                value={pageSize}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                options={[5, 10, 50, 100].map(size => ({ label: size, value: size }))}
              />
              <span className="text-xs font-black uppercase tracking-widest text-text-dim font-battambang">ក្នុងមួយទំព័រ</span>
          </div>

          {/* Right: Navigation */}
          <div className="flex-1 flex items-center justify-end gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary !size-9 !px-0"
            >
              <IconChevronLeft className="size-4" />
            </button>
            
            <div className="flex items-center gap-1 min-w-[60px] justify-center">
              <span className="text-xs font-black text-text-main">{currentPage}</span>
              <span className="text-xs font-bold text-text-dim/30">/</span>
              <span className="text-xs font-bold text-text-dim">{Math.ceil(totalRows / pageSize) || 1}</span>
            </div>

            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil(totalRows / pageSize)}
              className="btn-secondary !size-9 !px-0"
            >
              <IconChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar (Filament Style) */}
      <div 
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] transition-all duration-500 ${
          selectedIds.size > 0 ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-6 rounded-2xl bg-zinc-950 px-6 py-3.5 shadow-2xl ring-1 ring-white/10 dark:ring-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3 pr-6 border-r border-white/10">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-black text-white shadow-lg shadow-primary/20">
              {selectedIds.size}
            </span>
            <span className="text-sm font-bold text-white font-battambang uppercase tracking-wide">បានជ្រើសរើស</span>
          </div>

          <div className="flex items-center gap-3">
            {canDelete && (
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50"
              >
                <IconTrash className="size-3.5" />
                <span className="font-battambang">លុបដែលបានជ្រើសរើស</span>
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors font-battambang"
            >
              បោះបង់
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
