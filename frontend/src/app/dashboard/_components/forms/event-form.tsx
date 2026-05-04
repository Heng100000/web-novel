"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { IconEvents, IconCalendar, IconHash, IconGlobe, IconChevronDown } from "../../dashboard-icons";
import { CustomSelect } from "../custom-select";
import { formatDate } from "@/lib/utils";
import { CustomDateTimePicker } from "../custom-date-time-picker";

interface EventFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ initialData, onSuccess, onCancel }: EventFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialData?.status || "Active");
  const [discountType, setDiscountType] = useState<"Percentage" | "Fixed Amount">(initialData?.discount_type || "Percentage");
  const [eventType, setEventType] = useState<"Promotion" | "FlashSale">(initialData?.event_type || "Promotion");

  // Helper to format date for datetime-local input (requires YYYY-MM-DDThh:mm)
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      // Handles formats like "2023-10-27T10:30:00Z" or "2023-10-27 10:30:00"
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      
      const y = date.getFullYear();
      const m = pad(date.getMonth() + 1);
      const d = pad(date.getDate());
      const h = pad(date.getHours());
      const min = pad(date.getMinutes());
      
      return `${y}-${m}-${d}T${h}:${min}`;
    } catch (e) {
      return "";
    }
  };

  const [startDate, setStartDate] = useState<string>(formatDateForInput(initialData?.start_date));
  const [endDate, setEndDate] = useState<string>(formatDateForInput(initialData?.end_date));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Logic check
    if (new Date(startDate) >= new Date(endDate)) {
      setError("ថ្ងៃបញ្ចប់ត្រូវតែនៅក្រោយថ្ងៃចាប់ផ្តើម / End date must be after start date");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      discount_type: discountType,
      discount_value: formData.get("discount_value") || 0,
      discount_percentage: discountType === "Percentage" ? formData.get("discount_value") : 0, // Fallback for old code if needed
      start_date: startDate,
      end_date: endDate,
      event_type: eventType,
      show_in_banner: formData.get("show_in_banner") === "on" ? 1 : 0,
      show_in_homepage: formData.get("show_in_homepage") === "on" ? 1 : 0,
      banner_url: formData.get("banner_url"),
      status: selectedStatus,
    };

    const url = initialData ? `/events/${initialData.id}/` : "/events/";
    const method = initialData ? "PATCH" : "POST";

    try {
      await apiClient(url, {
        method,
        body: JSON.stringify(data),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div className="rounded-2xl bg-red-600 p-4 text-center text-sm font-bold text-white shadow-xl">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-border-dim bg-card-bg p-6 shadow-sm ring-1 ring-border-dim lg:p-8 transition-all">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dim/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconEvents className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main font-battambang">{initialData ? "កែប្រែព្រឹត្តិការណ៍" : "គ្រប់គ្រងព្រឹត្តិការណ៍"}</h2>
              <p className="text-xs font-medium text-text-dim font-battambang">កំណត់ព័ត៌មានលម្អិត និងកាលវិភាគផ្សព្វផ្សាយ</p>
            </div>
          </div>

          {/* Event Type Selector */}
          <div className="flex bg-bg-soft/50 p-1 rounded-xl border border-border-dim/30 w-fit">
            <button
              type="button"
              onClick={() => setEventType("Promotion")}
              className={`px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all flex items-center gap-2 ${eventType === "Promotion" ? "bg-white text-primary shadow-sm border border-border-dim/50" : "text-text-dim hover:text-text-main"}`}
            >
              <div className={`size-1.5 rounded-full ${eventType === "Promotion" ? "bg-primary" : "bg-text-dim/30"}`} />
              Promotion
            </button>
            <button
              type="button"
              onClick={() => setEventType("FlashSale")}
              className={`px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all flex items-center gap-2 ${eventType === "FlashSale" ? "bg-primary text-white shadow-md" : "text-text-dim hover:text-text-main"}`}
            >
              <div className={`size-1.5 rounded-full ${eventType === "FlashSale" ? "bg-white" : "bg-text-dim/30"}`} />
              Flash Sale
            </button>
            <input type="hidden" name="event_type" value={eventType} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
              ចំណងជើងព្រឹត្តិការណ៍ <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 transition-colors group-focus-within:text-primary pointer-events-none">
                <IconEvents className="size-4" strokeWidth={1.8} />
              </div>
                <input
                  name="title"
                  type="text"
                  required
                  defaultValue={initialData?.title}
                  className="input-standard input-with-icon"
                  placeholder="ឧ. ពិសេសឱកាសបុណ្យចូលឆ្នាំខ្មែរ"
                />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
              ការពិពណ៌នា
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={initialData?.description}
              className="input-standard resize-y min-h-[80px]"
              placeholder="ព័ត៌មានលម្អិតទីផ្សារសម្រាប់ការផ្សព្វផ្សាយនេះ..."
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <CustomDateTimePicker
              label="ថ្ងៃចាប់ផ្តើម"
              required
              value={startDate}
              onChange={setStartDate}
            />
            <CustomDateTimePicker
              label="ថ្ងៃបញ្ចប់"
              required
              min={startDate}
              value={endDate}
              onChange={setEndDate}
            />
          </div>

          {/* Discount & Assets */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang flex items-center justify-between">
                <span>បញ្ចុះតម្លៃ {discountType === "Percentage" ? "(%)" : "(៛)"}</span>
                <div className="flex bg-bg-soft/50 p-1 rounded-xl border border-border-dim/30">
                  <button
                    type="button"
                    onClick={() => setDiscountType("Percentage")}
                    className={`px-3 py-1 text-[13px] font-bold rounded-lg transition-all ${discountType === "Percentage" ? "bg-primary text-white shadow-md" : "text-text-dim/60 hover:text-text-main"}`}
                  >
                    % ភាគរយ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("Fixed Amount")}
                    className={`px-3 py-1 text-[13px] font-bold rounded-lg transition-all ${discountType === "Fixed Amount" ? "bg-primary text-white shadow-md" : "text-text-dim/60 hover:text-text-main"}`}
                  >
                    ៛ រៀល
                  </button>
                </div>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 transition-colors group-focus-within:text-primary pointer-events-none">
                  <IconHash className="size-4" strokeWidth={1.8} />
                </div>
                <input
                  name="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  max={discountType === "Percentage" ? 100 : undefined}
                  defaultValue={initialData?.discount_value || initialData?.discount_percentage || 0}
                  className="input-standard input-with-icon"
                  placeholder={discountType === "Percentage" ? "0.00 %" : "0.00 ៛"}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
                តំណភ្ជាប់បដា (Banner URL)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 transition-colors group-focus-within:text-primary pointer-events-none">
                  <IconGlobe className="size-4" strokeWidth={1.8} />
                </div>
                <input
                  name="banner_url"
                  type="text"
                  defaultValue={initialData?.banner_url}
                  className="input-standard input-with-icon"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
            </div>
          </div>

          {/* Status & Options */}
          <div className="flex flex-wrap gap-10 items-center pt-2">
            <div className="flex items-center gap-3.5 group">
              <input
                id="show_in_homepage"
                name="show_in_homepage"
                type="checkbox"
                defaultChecked={initialData?.show_in_homepage === 1}
                className="size-5.5 rounded-lg border border-grayborde bg-input-bg text-primary focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
              />
              <label htmlFor="show_in_homepage" className="text-[13px] font-bold text-text-main select-none cursor-pointer group-hover:text-primary transition-colors font-battambang">
                បង្ហាញនៅលើទំព័រដើម
              </label>
            </div>

            <div className="flex items-center gap-3.5 group">
              <input
                id="show_in_banner"
                name="show_in_banner"
                type="checkbox"
                defaultChecked={initialData?.show_in_banner === 1}
                className="size-5.5 rounded-lg border border-grayborde bg-input-bg text-primary focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
              />
              <label htmlFor="show_in_banner" className="text-[13px] font-bold text-text-main select-none cursor-pointer group-hover:text-primary transition-colors font-battambang">
                បង្ហាញនៅលើបដា (Banner)
              </label>
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className="relative group">
                <CustomSelect
                  options={[
                    { label: "ស្ថានភាពសកម្ម (Active)", value: "Active" },
                    { label: "មិនសកម្ម / លាក់ទុក (Inactive)", value: "Inactive" },
                    { label: "របៀបព្រាង (Draft)", value: "Draft" },
                  ]}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                />
                <input type="hidden" name="status" value={selectedStatus} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-4 transition-all">
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
          ) : initialData ? "រក្សាទុកការផ្លាស់ប្តូរ" : "បង្កើតព្រឹត្តិការណ៍ថ្មី"}
        </button>
      </div>
    </form>
  );
}
