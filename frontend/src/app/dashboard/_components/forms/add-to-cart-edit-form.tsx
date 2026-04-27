"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { IconBooks, IconOrders, IconArrowLeft, IconCheck } from "../../dashboard-icons";
import { useRouter } from "next/navigation";

interface AddToCartEditFormProps {
  id: string;
  initialData: {
    book: string;
    quantity: number;
    book_details?: any;
  };
}

export function AddToCartEditForm({ id, initialData }: AddToCartEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [fetchingBooks, setFetchingBooks] = useState(true);
  
  // State for the item being edited
  const [bookId, setBookId] = useState(initialData.book.toString());
  const [quantity, setQuantity] = useState(initialData.quantity);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!bookId) {
      setError("Please select a book");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient<any>(`/add-to-cart/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ 
          book: bookId, 
          quantity: quantity 
        }),
      });
      router.push("/dashboard/add-to-cart");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update entry");
    } finally {
      setLoading(false);
    }
  };

  const selectedBook = books.find(b => b.id.toString() === bookId);

  return (
    <form onSubmit={handleSubmit} className="relative space-y-8">
      <div className="rounded-3xl border border-grayborde bg-card-bg p-8 shadow-sm ring-1 ring-border-dim transition-all">
        <div className="mb-8 border-b border-grayborde pb-6 font-battambang">
          <h2 className="text-xl font-black text-text-main">បច្ចុប្បន្នភាពទិន្នន័យកញ្ចប់</h2>
          <p className="text-sm font-medium text-text-dim">កែប្រែជម្រើសសៀវភៅ ឬចំនួនសម្រាប់កំណត់ត្រានេះ</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Book Selection Section */}
          <div className="space-y-3 font-battambang">
            <label className="text-[11px] font-black uppercase tracking-wider text-text-dim">ឈ្មោះផលិតផល/សៀវភៅ</label>
            <div className="relative">
              <div 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`flex h-14 w-full items-center justify-between rounded-2xl border px-4 transition-all cursor-pointer ${
                  bookId ? "border-grayborde bg-input-bg" : "border-grayborde bg-input-bg"
                } ${isSearchOpen ? "border-primary dark:border-emerald-500 ring-[3px] ring-primary/10" : ""}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <IconBooks className={`size-5 ${bookId ? "text-primary dark:text-emerald-500" : "text-text-dim/60"}`} />
                  <span className={`text-sm font-black truncate font-battambang ${bookId ? "text-text-main" : "text-text-dim"}`}>
                    {selectedBook ? selectedBook.title : "ជ្រើសរើសសៀវភៅ..."}
                  </span>
                </div>
                {selectedBook && (
                  <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-black text-primary font-battambang">
                    ស្តុក៖ {selectedBook.stock_qty ?? 0}
                  </span>
                )}
              </div>

              {isSearchOpen && (
                <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-60 overflow-hidden rounded-2xl border border-grayborde bg-card-bg shadow-2xl animate-in fade-in zoom-in-95 duration-200 ring-1 ring-border-dim">
                  <div className="p-3 border-b border-grayborde bg-bg-soft/50">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="វាយដើម្បីស្វែងរកសៀវភៅ..."
                      className="w-full rounded-xl border border-grayborde bg-input-bg py-2.5 px-4 text-sm font-bold text-text-main outline-none focus:border-primary dark:focus:border-emerald-500 font-battambang"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2">
                    {books
                      .filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(book => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => {
                            setBookId(book.id.toString());
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold rounded-xl transition-all font-battambang ${
                            bookId === book.id.toString() 
                              ? "bg-primary text-white" 
                              : "text-text-main hover:bg-bg-soft hover:text-primary dark:hover:text-emerald-500"
                          }`}
                        >
                          <span>{book.title}</span>
                          <span className={`text-[10px] font-battambang ${bookId === book.id.toString() ? "text-white/70" : "text-text-dim"}`}>
                            ស្តុក៖ {book.stock_qty ?? 0}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quantity Section */}
          <div className="space-y-3 font-battambang">
            <label className="text-[11px] font-black uppercase tracking-wider text-text-dim">ចំនួនដែលត្រូវកែតម្រូវ</label>
            <div className="relative">
              <IconOrders className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-dim/60" />
              <input 
                type="number"
                min="1"
                max={selectedBook ? selectedBook.stock_qty : undefined}
                className="h-14 w-full rounded-2xl border border-grayborde bg-input-bg pl-12 pr-4 text-base font-black text-text-main outline-none transition-all focus:border-primary dark:focus:border-emerald-500 focus:ring-[3px] focus:ring-primary/10"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Pricing Summary Preview */}
        {selectedBook && (
          <div className="mt-8 rounded-2xl bg-bg-soft/50 p-6 border border-grayborde">
            <div className="flex items-center justify-between font-battambang">
              <span className="text-xs font-black uppercase tracking-widest text-text-dim">ការប្រៀបធៀបផលប៉ះពាល់</span>
              <div className="flex gap-4">
                <div className="text-right font-battambang">
                  <p className="text-[10px] font-bold text-text-dim uppercase">តម្លៃរាយ</p>
                  <p className="text-sm font-black text-text-main">${parseFloat(selectedBook.discounted_price || selectedBook.price || 0).toFixed(2)}</p>
                </div>
                <div className="text-right font-battambang">
                  <p className="text-[10px] font-bold text-text-dim uppercase">សរុបរង</p>
                  <p className="text-sm font-black text-primary dark:text-emerald-500">${(parseFloat(selectedBook.discounted_price || selectedBook.price || 0) * (quantity || 0)).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-bg-soft px-5 py-2.5 text-xs font-black uppercase tracking-widest text-text-dim transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-text-main active:scale-95 font-battambang"
        >
          <IconArrowLeft className="size-3.5" />
          ត្រឡប់ក្រោយ
        </button>
        <button
          type="submit"
          disabled={loading || fetchingBooks}
          className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 font-battambang"
        >
          {loading ? (
            "កំពុងរក្សាទុក..."
          ) : (
            <>
              <IconCheck className="size-3.5" />
              រក្សាទុកការផ្លាស់ប្តូរ
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md z-[200]">
          <div className="rounded-2xl bg-red-600 p-4 text-center text-sm font-black text-white shadow-2xl animate-in slide-in-from-bottom-4">
            {error}
          </div>
        </div>
      )}
    </form>
  );
}
