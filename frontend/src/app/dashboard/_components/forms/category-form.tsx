"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { IconTags, IconMenu, IconGlobe } from "../../dashboard-icons";

interface CategoryFormProps {
  initialData?: {
    id: number;
    name: string;
    name_km?: string;
    slug: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ initialData, onSuccess, onCancel }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      name_km: formData.get("name_km"),
      slug: formData.get("slug"),
    };

    try {
      const url = initialData ? `/categories/${initialData.id}/` : "/categories/";
      const method = initialData ? "PATCH" : "POST";

      await apiClient(url, {
        method,
        body: JSON.stringify(data),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${initialData ? "update" : "create"} category`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex flex-col gap-8">
        {/* Section: Category Details */}
        <section className="rounded-3xl border border-grayborde bg-card-bg p-6 shadow-sm ring-1 ring-border-dim lg:p-8 transition-all">
            <div className="mb-6 flex items-center gap-3 border-b border-grayborde/50 pb-5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <IconTags className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-main font-battambang">{initialData ? "កែប្រែប្រភេទ" : "ការចុះឈ្មោះប្រភេទថ្មី"}</h2>
                <p className="text-xs font-medium text-text-dim font-battambang">{initialData ? "ធ្វើបច្ចុប្បន្នភាពព័ត៌មានលម្អិតនៃប្រភេទនេះ" : "កំណត់របៀបដែលប្រភេទនេះបង្ហាញនៅក្នុងហាង"}</p>
              </div>
            </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="name" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                ឈ្មោះប្រភេទ (អង់គ្លេស) <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary">
                  <IconTags className="size-4.5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={initialData?.name}
                  placeholder="e.g., Epic Fantasy"
                  className="input-standard input-with-icon"
                  onChange={(e) => {
                    const slugInput = (e.currentTarget.form?.elements.namedItem("slug") as HTMLInputElement);
                    if (slugInput && !slugInput.dataset.manual && !initialData) {
                      slugInput.value = e.target.value.toLowerCase().replace(/[^a-z0-0]+/g, '-').replace(/(^-|-$)/g, '');
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label htmlFor="name_km" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                ឈ្មោះប្រភេទ (ខ្មែរ)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary">
                  <IconTags className="size-4.5" />
                </div>
                <input
                  id="name_km"
                  name="name_km"
                  type="text"
                  defaultValue={initialData?.name_km}
                  placeholder="ឧទាហរណ៍៖ រឿងព្រេង"
                  className="input-standard input-with-icon font-khmer"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label htmlFor="slug" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                ស្លាក URL (Slug) <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary">
                  <IconGlobe className="size-4.5" />
                </div>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  defaultValue={initialData?.slug}
                  placeholder="epic-fantasy"
                  className="input-standard input-with-icon"
                  onInput={(e) => (e.currentTarget as any).dataset.manual = "true"}
                />
              </div>
              <p className="px-1 text-[10px] font-medium text-text-dim font-battambang">អត្តសញ្ញាណដែលបង្ហាញជាសាធារណៈសម្រាប់ URL ហាង</p>
            </div>
          </div>
        </section>
      </div>

      {/* Action Bar */}
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
              កំពុងរក្សាទុក...
            </div>
          ) : initialData ? "រក្សាទុកការផ្លាស់ប្តូរ" : "បង្កើតប្រភេទថ្មី"}
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
