import { useEffect, useState, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { IconBooks, IconSearch, IconBell, IconTags, IconPen, IconMenu, IconChevronLeft, IconChevronRight, IconHash, IconChevronDown } from "../../dashboard-icons";
import { formatImageUrl } from "@/lib/utils";
import { CustomSelect } from "../custom-select";
import { AuthorGridPicker } from "../author-grid-picker";

// Basic icons for photo management if not in dashboard-icons
function IconPhoto({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface ImageFile {
  file: File;
  preview: string;
}

interface BookFormProps {
  initialData?: {
    id: number;
    title: string;
    description: string;
    isbn: string;
    price: string;
    price_riel?: string;
    stock_qty: number;
    is_active: number;
    category: number;
    author: number;
    edition_type?: string;
    event_id?: number;
    images: { id: number; image_url: string; is_main: number }[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function BookForm({ initialData, onSuccess, onCancel }: BookFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [authors, setAuthors] = useState<{id: number, name: string, name_km?: string, photo_url?: string}[]>([]);
  const [events, setEvents] = useState<{id: number, title: string, discount_percentage?: number}[]>([]);
  
  const [images, setImages] = useState<ImageFile[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: number; image_url: string; is_main: number }[]>(initialData?.images || []);
  const [mainImageIdx, setMainImageIdx] = useState(initialData?.images?.findIndex(img => img.is_main === 1) ?? 0);
  const [isActive, setIsActive] = useState(initialData ? initialData.is_active === 1 : true);
  
  // Custom Select States
  const [selectedAuthor, setSelectedAuthor] = useState<number | string>(initialData?.author || "");
  const [selectedCategory, setSelectedCategory] = useState<number | string>(initialData?.category || "");
  const [selectedEdition, setSelectedEdition] = useState<string>(initialData?.edition_type || "Standard");
  const [selectedEvent, setSelectedEvent] = useState<number | string>(initialData?.event_id || "");
  
  const [price, setPrice] = useState<string>(initialData?.price || "");
  const [priceRiel, setPriceRiel] = useState<string>(initialData?.price_riel || "");

  const handlePriceRielChange = (val: string) => {
    setPriceRiel(val);
    if (val && !isNaN(parseFloat(val))) {
      const usd = (parseFloat(val) / 4000).toFixed(2);
      setPrice(usd);
    }
  };

  const handlePriceUsdChange = (val: string) => {
    setPrice(val);
    if (val && !isNaN(parseFloat(val))) {
      const riel = Math.round(parseFloat(val) * 4000).toString();
      setPriceRiel(riel);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, authsRes, eventsRes] = await Promise.all([
          apiClient<{ results: {id: number, name: string}[], count: number } | {id: number, name: string}[]>("/categories/?page_size=100"),
          apiClient<{ results: {id: number, name: string}[], count: number } | {id: number, name: string}[]>("/authors/?page_size=100"),
          apiClient<{ results: {id: number, title: string}[], count: number } | {id: number, title: string}[]>("/events/?page_size=100"),
        ]);
        
        setCategories(Array.isArray(catsRes) ? catsRes : catsRes.results);
        setAuthors(Array.isArray(authsRes) ? authsRes : authsRes.results);
        setEvents(Array.isArray(eventsRes) ? eventsRes : eventsRes.results);
      } catch (err) {
        console.error("Failed to load form data", err);
        setError("Failed to load categories or authors. Please try again.");
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].preview);
      return updated;
    });
    if (mainImageIdx === index) setMainImageIdx(0);
    else if (mainImageIdx > index) setMainImageIdx(mainImageIdx - 1);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formElement = e.currentTarget;
    const nativeFormData = new FormData(formElement);
    
    const formData = new FormData();
    formData.append("title", nativeFormData.get("title") as string);
    formData.append("price", nativeFormData.get("price") as string);
    formData.append("price_riel", nativeFormData.get("price_riel") as string || "0");
    formData.append("isbn", nativeFormData.get("isbn") as string || "");
    formData.append("stock_qty", nativeFormData.get("stock_qty") as string || "0");
    formData.append("description", nativeFormData.get("description") as string || "");
    formData.append("category", nativeFormData.get("category") as string);
    formData.append("author", nativeFormData.get("author") as string);
    formData.append("edition_type", nativeFormData.get("edition_type") as string || "Standard");
    formData.append("event_id", nativeFormData.get("event_id") as string || "");
    formData.append("is_active", isActive ? "1" : "0");
    formData.append("main_image_idx", mainImageIdx.toString());

    images.forEach((img) => {
      formData.append("images", img.file);
    });

    try {
      const url = initialData ? `/books/${initialData.id}/` : "/books/";
      const method = initialData ? "PATCH" : "POST";

      await apiClient(url, {
        method,
        body: formData,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${initialData ? "update" : "create"} book`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-text-dim">
        <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading options...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
        {/* Left Column - Main Content */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Section: General Info */}
          <section className="rounded-3xl border border-grayborde bg-card-bg p-6 shadow-sm ring-1 ring-border-dim lg:p-8 transition-all">
            <div className="mb-6 flex items-center gap-3 border-b border-grayborde/50 pb-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <IconPen className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main font-battambang">ព័ត៌មានទូទៅ</h2>
                <p className="text-xs font-medium text-text-dim font-battambang">ផ្តល់ព័ត៌មានមូលដ្ឋានរបស់សៀវភៅ</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-2.5">
                <label htmlFor="title" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                  ចំណងជើងសៀវភៅ <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/60 transition-colors group-focus-within:text-primary dark:group-focus-within:text-emerald-500">
                    <IconPen className="size-4.5" />
                  </div>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    defaultValue={initialData?.title}
                    placeholder="បញ្ចូលចំណងជើងសៀវភៅ"
                    className="input-standard input-with-icon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2.5">
                  <label htmlFor="author" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                    អ្នកនិពន្ធ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <AuthorGridPicker 
                      authors={authors}
                      value={selectedAuthor}
                      onChange={setSelectedAuthor}
                    />
                    <input type="hidden" name="author" value={selectedAuthor} />
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <label htmlFor="category" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                    ប្រភេទ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/60 transition-colors group-focus-within:text-primary dark:group-focus-within:text-emerald-500 pointer-events-none">
                      <IconTags className="size-4.5" />
                    </div>
                    <CustomSelect
                      options={categories.map(c => ({ label: c.name, value: c.id }))}
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                    />
                    <input type="hidden" name="category" value={selectedCategory} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="edition_type" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                  ប្រភេទបោះពុម្ព / ស្ថានភាពចេញផ្សាយ <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary pointer-events-none">
                    <IconBooks className="size-4.5" />
                  </div>
                  <CustomSelect
                    options={[
                      { label: "ការបោះពុម្ពស្តង់ដារ (Standard)", value: "Standard" },
                      { label: "សៀវភៅមកថ្មី (New Arrival)", value: "New Arrival" },
                      { label: "ការបោះពុម្ពពិសេស (Special)", value: "Special Edition" },
                      { label: "ការបោះពុម្ពមានកំណត់ (Limited)", value: "Limited Edition" },
                      { label: "បោះពុម្ពឡើងវិញ (Reprint)", value: "Reprint" },
                    ]}
                    value={selectedEdition}
                    onChange={setSelectedEdition}
                  />
                  <input type="hidden" name="edition_type" value={selectedEdition} />
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="event_id" className="text-[13px] font-bold text-text-main px-1 font-battambang">ព្រឹត្តិការណ៍ផ្សព្វផ្សាយ</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary pointer-events-none">
                    <IconBooks className="size-4.5" />
                  </div>
                  <CustomSelect
                    options={[
                      { label: "គ្មានព្រឹត្តិការណ៍", value: "" },
                      ...events.map(e => ({ label: e.title, value: e.id }))
                    ]}
                    value={selectedEvent}
                    onChange={setSelectedEvent}
                  />
                  <input type="hidden" name="event_id" value={selectedEvent} />
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="description" className="text-[13px] font-bold text-text-main px-1 font-battambang">សេចក្ដីសង្ខេប / ការពិពណ៌នា</label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  defaultValue={initialData?.description}
                  placeholder="ពិពណ៌នាអំពីខ្លឹមសារនៃសៀវភៅនេះ..."
                  className="input-standard resize-y min-h-[120px]"
                />
              </div>
            </div>
          </section>

          {/* Section: Inventory */}
          <section className="rounded-3xl border border-grayborde bg-card-bg p-6 shadow-sm ring-1 ring-border-dim lg:p-8 transition-all">
            <div className="mb-6 flex items-center gap-3 border-b border-grayborde/50 pb-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <IconBooks className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main font-battambang">សារពើភ័ណ្ឌ និងតម្លៃ</h2>
                <p className="text-xs font-medium text-text-dim font-battambang">គ្រប់គ្រងស្តុក និងតម្លៃទីផ្សារ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2.5">
                <label htmlFor="price_riel" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                  តម្លៃ (KHR ៛)
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/60 transition-colors group-focus-within:text-primary dark:group-focus-within:text-emerald-500">
                    <span className="text-sm font-black text-[12px]">៛</span>
                  </div>
                  <input
                    id="price_riel"
                    name="price_riel"
                    type="number"
                    value={priceRiel}
                    onChange={(e) => handlePriceRielChange(e.target.value)}
                    className="input-standard input-with-icon"
                  />
                </div>
                {selectedEvent && events.find(e => e.id.toString() === selectedEvent.toString()) && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2 ring-1 ring-emerald-600/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-battambang">តម្លៃបញ្ចុះ ៛</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-600">
                         {(() => {
                          const event = events.find(e => e.id.toString() === selectedEvent.toString());
                          const p = parseFloat(priceRiel || "0");
                          if (!event) return p.toLocaleString() + " ៛";
                          
                          // @ts-ignore
                          const dType = event.discount_type || 'Percentage';
                          // @ts-ignore
                          const dVal = parseFloat(event.discount_value || event.discount_percentage || "0");
                          
                          let discounted = p;
                          if (dType === 'Fixed Amount') {
                            discounted = p - dVal;
                          } else {
                            discounted = p * (1 - dVal / 100);
                          }
                          return Math.max(0, discounted).toLocaleString() + " ៛";
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="price" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                  តម្លៃ (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/60 transition-colors group-focus-within:text-primary dark:group-focus-within:text-emerald-500">
                    <span className="text-sm font-black">$</span>
                  </div>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => handlePriceUsdChange(e.target.value)}
                    className="input-standard input-with-icon"
                  />
                </div>
                {selectedEvent && events.find(e => e.id.toString() === selectedEvent.toString()) && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2 ring-1 ring-amber-600/10">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider font-battambang">តម្លៃបញ្ចុះ USD</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-600">
                        {(() => {
                          const event = events.find(e => e.id.toString() === selectedEvent.toString());
                          const p = parseFloat(price || "0");
                          if (!event) return "USD " + p.toFixed(2);
                          
                          // @ts-ignore
                          const dType = event.discount_type || 'Percentage';
                          // @ts-ignore
                          const dVal = parseFloat(event.discount_value || event.discount_percentage || "0");
                          
                          let discounted = p;
                          if (dType === 'Fixed Amount') {
                            discounted = p - (dVal / 4000);
                          } else {
                            discounted = p * (1 - dVal / 100);
                          }
                          return "USD " + Math.max(0, discounted).toFixed(2);
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
              <div className="flex flex-col gap-2.5">
                <label htmlFor="stock_qty" className="text-[13px] font-bold text-text-main px-1 font-battambang">ចំនួនស្តុកដំបូង</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary">
                    <IconHash className="size-4.5" />
                  </div>
                  <input
                    id="stock_qty"
                    name="stock_qty"
                    type="number"
                    defaultValue={initialData?.stock_qty ?? "0"}
                    className="input-standard input-with-icon"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <label htmlFor="isbn" className="text-[13px] font-bold text-text-main px-1 font-battambang">លេខកូដ ISBN</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary">
                    <IconHash className="size-4.5" />
                  </div>
                  <input
                    id="isbn"
                    name="isbn"
                    type="text"
                    defaultValue={initialData?.isbn}
                    placeholder="000-0000000"
                    className="input-standard input-with-icon"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Sidebar */}
        <div className="flex flex-col gap-8">
          {/* Section: Status */}
          <section className="rounded-3xl border border-grayborde bg-card-bg p-6 shadow-sm ring-1 ring-border-dim transition-all">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-main uppercase tracking-tight font-battambang">ស្ថានភាព</h2>
              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${isActive ? "bg-primary/10 dark:bg-emerald-500/10 text-primary dark:text-emerald-500" : "bg-bg-soft text-text-dim"}`}>
                {isActive ? "ផ្សព្វផ្សាយ" : "ព្រាង"}
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4 py-2 border-t border-grayborde/30 mt-4 pt-4">
              <span className="text-xs font-bold text-text-dim uppercase tracking-wider font-battambang">បង្ហាញនៅក្នុងហាង</span>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
                  isActive ? "bg-primary dark:bg-emerald-600" : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isActive ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Section: Media */}
          <section className="rounded-3xl border border-grayborde bg-card-bg p-6 shadow-sm ring-1 ring-border-dim transition-all">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-text-main uppercase tracking-tight font-battambang">វិចិត្រសាលរូបភាព</h2>
              <p className="text-[10px] font-medium text-text-dim mt-1 font-battambang">បង្ហោះគម្របសៀវភៅ និងរូបភាពនានា</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {existingImages.map((img, idx) => (
                <div 
                  key={`existing-${img.id}`} 
                  className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border-2 transition-all ${
                    mainImageIdx === idx ? "border-primary" : "border-grayborde/40"
                  }`}
                >
                  <img src={formatImageUrl(img.image_url)} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white bg-black/20 px-2 py-1 rounded backdrop-blur-sm font-battambang">មានក្នុងស្តុក</span>
                  </div>
                  
                  {img.is_main === 1 && (
                    <div className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[8px] font-black text-white shadow-lg">
                      គម្រប
                    </div>
                  )}
                </div>
              ))}

              {images.map((img, idx) => (
                <div 
                  key={`new-${idx}`} 
                  className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border-2 transition-all ${
                    mainImageIdx === (idx + existingImages.length) ? "border-primary" : "border-grayborde/40"
                  }`}
                >
                  <img src={img.preview} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-900/90 text-red-600 dark:text-red-400 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white dark:hover:bg-zinc-800"
                  >
                    <IconX className="size-3.5" />
                  </button>
                  
                  {(mainImageIdx === (idx + existingImages.length)) && (
                    <div className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[8px] font-black text-white">
                      គម្របថ្មី
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setMainImageIdx(idx + existingImages.length)}
                    className={`absolute bottom-2 left-2 right-2 rounded-lg py-1.5 text-[9px] font-bold transition-all ${
                      mainImageIdx === (idx + existingImages.length) 
                        ? "bg-primary text-white" 
                        : "bg-white/90 dark:bg-zinc-800/90 text-text-main opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-zinc-700"
                    }`}
                  >
                    {mainImageIdx === (idx + existingImages.length) ? "បានជ្រើសរើស" : "កំណត់ជាគម្រប"}
                  </button>
                </div>
              ))}
              
              <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-grayborde bg-bg-soft/50 transition-all hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-emerald-500/5 group"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-card-bg text-text-dim shadow-sm group-hover:scale-110 transition-transform">
                <IconPhoto className="size-5" />
              </div>
              <span className="text-[10px] font-bold text-text-dim font-battambang">បន្ថែមរូបថត</span>
            </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </section>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-start gap-3 border-t border-grayborde pt-8 transition-all">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary font-battambang"
        >
          បោះបង់
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary min-w-[180px] font-battambang"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              កំពុងដំណើរការ...
            </div>
          ) : initialData ? "រក្សាទុកការផ្លាស់ប្តូរ" : "ផ្សព្វផ្សាយសៀវភៅ"}
        </button>
      </div>
      
      {error && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 z-50">
          <div className="rounded-2xl bg-red-600 p-4 text-center text-sm font-bold text-white shadow-2xl">
            {error}
          </div>
        </div>
      )}
    </form>
  );
}
