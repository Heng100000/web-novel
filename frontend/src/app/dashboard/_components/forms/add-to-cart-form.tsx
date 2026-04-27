"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { IconOrders, IconBooks, IconPlus, IconTrash, IconSearch } from "../../dashboard-icons";

interface AddToCartFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface RepeaterItem {
  id: string; // Internal unique ID for React keys
  bookId: string;
  quantity: number;
  isSearchOpen: boolean;
  searchQuery: string;
}

export function AddToCartForm({ onSuccess, onCancel }: AddToCartFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [fetchingBooks, setFetchingBooks] = useState(true);
  const [items, setItems] = useState<RepeaterItem[]>([
    { id: Math.random().toString(36).substr(2, 9), bookId: "", quantity: 1, isSearchOpen: false, searchQuery: "" }
  ]);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await apiClient<any>("/books/");
        setBooks(response.results || response);
      } catch (err) {
        console.error("Failed to fetch books", err);
      } finally {
        setFetchingBooks(false);
      }
    }
    fetchBooks();
  }, []);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), bookId: "", quantity: 1, isSearchOpen: false, searchQuery: "" }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, updates: Partial<RepeaterItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Filter out invalid items
    const validItems = items
      .filter(item => item.bookId)
      .map(item => ({ book: item.bookId, quantity: item.quantity }));

    if (validItems.length === 0) {
      setError("សូមជ្រើសរើសសៀវភៅយ៉ាងហោចណាស់មួយក្បាល");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient<any>("/add-to-cart/", {
        method: "POST",
        body: JSON.stringify({ items: validItems }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to add entries");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex flex-col gap-6">
        {/* Repeater Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-text-main font-battambang">បញ្ជីសៀវភៅក្នុងកញ្ចប់</h2>
              <p className="text-[10px] font-medium text-text-dim font-battambang">បន្ថែមសៀវភៅ និងចំនួនដែលត្រូវតាមដាន</p>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className="group relative flex flex-col md:flex-row items-start md:items-center gap-4 rounded-xl border border-grayborde bg-card-bg p-4 shadow-[var(--filament-shadow-sm)] transition-all hover:border-primary/30 hover:shadow-md"
              >
                {/* Row Number */}
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-soft text-[10px] font-black text-text-dim">
                  {index + 1}
                </div>

                {/* Book Selection (Searchable) */}
                <div className="relative flex-1 w-full">
                  <div className="flex flex-col gap-1.5 w-full">
                    <div 
                      onClick={() => updateItem(item.id, { isSearchOpen: !item.isSearchOpen })}
                      className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 transition-all cursor-pointer ${
                        item.bookId ? "border-grayborde bg-bg-soft/30" : "border-grayborde bg-card-bg"
                      } ${item.isSearchOpen ? "border-primary dark:border-emerald-500 ring-4 ring-primary/5 shadow-sm" : ""}`}
                    >
                      <div className="flex items-center gap-3 truncate font-battambang">
                        <IconBooks className={`size-4 ${item.bookId ? "text-primary dark:text-emerald-500" : "text-text-dim"}`} />
                        <span className={`text-sm font-bold truncate ${item.bookId ? "text-text-main" : "text-text-dim"}`}>
                          {item.bookId ? books.find(b => b.id.toString() === item.bookId.toString())?.title : "ជ្រើសរើសសៀវភៅ..."}
                        </span>
                      </div>
                      {item.bookId && (
                        <span className="shrink-0 rounded-md bg-bg-soft px-2 py-0.5 text-[10px] font-black text-text-dim font-battambang">
                          ស្តុក៖ {books.find(b => b.id.toString() === item.bookId.toString())?.stock_qty ?? 0}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.isSearchOpen && (
                    <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-60 overflow-hidden rounded-lg border border-grayborde bg-card-bg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-2 border-b border-grayborde bg-bg-soft/50">
                        <div className="relative">
                          <IconSearch className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-dim" />
                          <input 
                            autoFocus
                            type="text"
                            placeholder="វាយដើម្បីស្វែងរក..."
                            className="w-full rounded-lg border border-grayborde bg-card-bg py-2 pl-9 pr-4 text-xs font-bold text-text-main outline-none focus:border-primary dark:focus:border-emerald-500 font-battambang"
                            value={item.searchQuery}
                            onChange={(e) => updateItem(item.id, { searchQuery: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto p-1">
                        {books
                          .filter(b => {
                            const isSelectedElsewhere = items.some(itemOther => 
                              itemOther.id !== item.id && itemOther.bookId.toString() === b.id.toString()
                            );
                            return b.title.toLowerCase().includes(item.searchQuery.toLowerCase()) && !isSelectedElsewhere;
                          })
                          .map(book => (
                            <button
                              key={book.id}
                              type="button"
                              onClick={() => {
                                const newQty = item.quantity > (book.stock_qty ?? 0) ? (book.stock_qty ?? 0) : item.quantity;
                                updateItem(item.id, { 
                                  bookId: book.id.toString(), 
                                  isSearchOpen: false, 
                                  searchQuery: "",
                                  quantity: newQty > 0 ? newQty : 1
                                });
                              }}
                              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold text-text-dim rounded-lg hover:bg-bg-soft hover:text-primary dark:hover:text-emerald-500 transition-colors"
                            >
                              <span>{book.title}</span>
                              <span className="text-[10px] opacity-60">ស្តុក៖ {book.stock_qty ?? 0}</span>
                            </button>
                          ))}
                        {books.filter(b => {
                          const isSelectedElsewhere = items.some(itemOther => 
                            itemOther.id !== item.id && itemOther.bookId.toString() === b.id.toString()
                          );
                          return b.title.toLowerCase().includes(item.searchQuery.toLowerCase()) && !isSelectedElsewhere;
                        }).length === 0 && (
                          <div className="px-4 py-3 text-center text-[10px] font-bold text-text-dim italic font-battambang">រកមិនឃើញលទ្ធផល</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity input */}
                <div className="flex items-center gap-3 w-full md:w-32">
                  <div className="relative w-full">
                    <IconOrders className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-dim" />
                    <input 
                      type="number"
                      min="1"
                      max={item.bookId ? books.find(b => b.id.toString() === item.bookId.toString())?.stock_qty : undefined}
                      className={`h-11 w-full rounded-lg border pl-10 pr-4 text-sm font-black outline-none transition-all ${
                        item.bookId && item.quantity > (books.find(b => b.id.toString() === item.bookId.toString())?.stock_qty ?? 0)
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 focus:ring-red-100"
                          : "border-grayborde bg-card-bg text-text-main focus:border-primary dark:focus:border-emerald-500 focus:ring-4 focus:ring-primary/5"
                      }`}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Delete button */}
                <button 
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg text-text-dim transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 disabled:opacity-0"
                >
                  <IconTrash className="size-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          {items.length < books.length && (
            <button 
              type="button"
              onClick={addItem}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-grayborde py-4 text-xs font-black uppercase tracking-wider text-text-dim transition-all hover:border-primary/50 hover:bg-primary/10 dark:hover:bg-emerald-500/10 hover:text-primary dark:hover:text-emerald-500 font-battambang"
            >
              <IconPlus className="size-4" />
              បន្ថែមសៀវភៅថ្មីមួយទៀត
            </button>
          )}
        </div>
      </div>

      {/* Submit Bar */}
      <div className="mt-12 flex items-center justify-start gap-3 border-t border-grayborde pt-8 transition-all font-battambang">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          បោះបង់
        </button>
        <button
          type="submit"
          disabled={loading || fetchingBooks}
          className="btn-primary min-w-[160px]"
        >
          {loading ? "កំពុងរក្សាទុក..." : "បង្កើតទិន្នន័យទាំងអស់"}
        </button>
      </div>

      {error && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
          <div className="rounded-xl bg-red-600 p-4 text-center text-sm font-bold text-white shadow-2xl">
            {error}
          </div>
        </div>
      )}
    </form>
  );
}
