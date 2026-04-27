"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { CategoryForm } from "../../../_components/forms/category-form";
import { IconChevronLeft } from "../../../dashboard-icons";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategory() {
      try {
        const data = await apiClient<any>(`/categories/${id}/`);
        setCategory(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch category");
      } finally {
        setLoading(false);
      }
    }
    fetchCategory();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-[#3f6815] border-t-transparent" />
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest font-battambang">កំពុងរៀបចំឧបករណ៍កែប្រែ...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl bg-red-50 p-8 text-center border border-red-100">
          <h2 className="text-xl font-bold text-red-600 mb-2 font-battambang">កំហុសឧបករណ៍កែប្រែ</h2>
          <p className="text-sm font-medium text-red-500 font-battambang">{error || "រកមិនឃើញប្រភេទសៀវភៅទេ"}</p>
          <button 
            onClick={() => router.back()}
            className="mt-6 rounded-xl bg-red-600 px-6 py-2.5 text-xs font-black text-white transition-all hover:bg-red-700 active:scale-95 font-battambang"
          >
            ត្រឡប់ក្រោយ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang">កែប្រែប្រភេទ</h1>
      </div>

      <CategoryForm
        initialData={category}
        onSuccess={() => router.push("/dashboard/categories")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
