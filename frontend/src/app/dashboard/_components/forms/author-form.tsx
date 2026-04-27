"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { IconPen, IconBooks, IconMenu, IconUser, IconGlobe, IconHash, IconChevronDown } from "../../dashboard-icons";
import { formatImageUrl } from "@/lib/utils";

interface AuthorFormProps {
  initialData?: {
    id: number;
    name: string;
    name_km?: string;
    biography: string;
    photo_url: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function AuthorForm({ initialData, onSuccess, onCancel }: AuthorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.photo_url ? formatImageUrl(initialData.photo_url) : null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formElement = e.currentTarget;
    const formData = new FormData();
    formData.append("name", (formElement.elements.namedItem("name") as HTMLInputElement).value);
    formData.append("name_km", (formElement.elements.namedItem("name_km") as HTMLInputElement).value);
    formData.append("biography", (formElement.elements.namedItem("biography") as HTMLTextAreaElement).value);
    
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    try {
      const url = initialData ? `/authors/${initialData.id}/` : "/authors/";
      const method = initialData ? "PATCH" : "POST";

      await apiClient(url, {
        method,
        body: formData,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${initialData ? "update" : "register"} author`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="mx-auto w-full">
        {/* Main Content Area */}
        <div className="flex flex-col gap-8">
          {/* Section: Profile Info */}
          <section className="rounded-3xl border border-grayborde bg-card-bg p-6 shadow-sm ring-1 ring-border-dim lg:p-10 transition-all">
            <div className="mb-8 flex items-center gap-3 border-b border-grayborde/50 pb-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <IconPen className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main font-battambang">{initialData ? "កែប្រែអ្នកនិពន្ធ" : "ការចុះឈ្មោះអ្នកនិពន្ធថ្មី"}</h2>
                <p className="text-xs font-medium text-text-dim font-battambang">{initialData ? "ធ្វើបច្ចុប្បន្នភាពប្រវត្តិរូបសាធារណៈរបស់អ្នកនិពន្ធនេះ" : "បង្កើតប្រវត្តិរូបអ្នកនិពន្ធថ្មី"}</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Photo Upload at the Top */}
              <div className="flex flex-col items-start gap-4">
                <div className="flex flex-col items-start gap-2 text-left">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim font-battambang">រូបថតអ្នកនិពន្ធ</label>
                  <p className="text-[10px] font-medium text-text-dim/60 font-battambang">PNG, JPG ឬ WebP។ ទំហំអតិបរមា 5MB។</p>
                </div>
                
                <div className="relative group">
                  <input
                    type="file"
                    id="photo_upload"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                  <div className={`relative flex size-48 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
                    previewUrl 
                      ? "border-primary/30 bg-primary/5 ring-8 ring-primary/5" 
                      : "border-grayborde bg-input-bg hover:border-primary/30 hover:bg-primary/5 hover:ring-8 hover:ring-border-dim/20"
                  }`}>
                    {previewUrl ? (
                      <div className="relative h-full w-full">
                        <img 
                          src={previewUrl} 
                          alt="Portrait Preview" 
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="rounded-full bg-white/20 px-4 py-2 text-[10px] font-bold text-white backdrop-blur-md font-battambang">ផ្លាស់ប្តូរ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-card-bg text-text-dim shadow-sm transition-transform group-hover:scale-110">
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold text-text-dim font-battambang">បង្ហោះរូបថត</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-2.5">
                  <label htmlFor="name" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                    ឈ្មោះអ្នកនិពន្ធ (អង់គ្លេស) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary">
                      <IconUser className="size-4.5" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      defaultValue={initialData?.name}
                      placeholder="e.g., Jane Austen"
                      className="input-standard input-with-icon"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  <label htmlFor="name_km" className="text-[13px] font-bold text-text-main px-1 font-battambang">
                    ឈ្មោះអ្នកនិពន្ធ (ខ្មែរ)
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary">
                      <IconUser className="size-4.5" />
                    </div>
                    <input
                      id="name_km"
                      name="name_km"
                      type="text"
                      defaultValue={initialData?.name_km}
                      placeholder="ឧទាហរណ៍៖ ឈ្មោះអ្នកនិពន្ធ"
                      className="input-standard input-with-icon font-khmer"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-2.5">
                  <label className="text-[13px] font-bold text-text-main px-1 font-battambang">ជ្រើសរើសតួនាទី</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary pointer-events-none">
                      <IconHash className="size-4.5" />
                    </div>
                    <div className="flex h-11 w-full items-center rounded-xl border border-grayborde bg-bg-soft/50 pl-12 pr-5 text-sm font-semibold text-text-dim shadow-sm font-battambang">
                      អ្នកនិពន្ធចម្បង / អ្នកចូលរួម
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="biography" className="text-[13px] font-bold text-text-main px-1 font-battambang">ជីវប្រវត្តិ និងប្រវត្តិសាវតារ</label>
                <textarea
                  id="biography"
                  name="biography"
                  rows={6}
                  defaultValue={initialData?.biography}
                  placeholder="ចែករំលែករឿងរ៉ាវរបស់អ្នកនិពន្ធ..."
                  className="input-standard resize-y min-h-[120px]"
                />
              </div>
            </div>
          </section>
        </div>
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
              កំពុងដំណើរការ...
            </div>
          ) : initialData ? "រក្សាទុកការផ្លាស់ប្តូរ" : "ចុះឈ្មោះអ្នកនិពន្ធ"}
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
