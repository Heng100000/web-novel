"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { AuthorForm } from "../../../_components/forms/author-form";
import { IconChevronLeft } from "../../../dashboard-icons";

export default function EditAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [author, setAuthor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuthor() {
      try {
        const data = await apiClient<any>(`/authors/${id}/`);
        setAuthor(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch author");
      } finally {
        setLoading(false);
      }
    }
    fetchAuthor();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest font-battambang">កំពុងបើកឧបករណ៍កែប្រែប្រវត្តិរូប...</p>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl bg-orange-50 p-8 text-center border border-orange-100">
          <h2 className="text-xl font-bold text-orange-600 mb-2 font-battambang">កំហុសឧបករណ៍កែប្រែ</h2>
          <p className="text-sm font-medium text-orange-500 font-battambang">{error || "រកមិនឃើញប្រវត្តិរូបអ្នកនិពន្ធទេ"}</p>
          <button 
            onClick={() => router.back()}
            className="mt-6 rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-black text-white transition-all hover:bg-orange-700 active:scale-95 font-battambang"
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
        <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang">កែប្រែប្រវត្តិរូប</h1>
      </div>

      <AuthorForm
        initialData={author}
        onSuccess={() => router.push("/dashboard/authors")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
