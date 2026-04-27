"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { BookForm } from "../../../_components/forms/book-form";
import { IconChevronLeft } from "../../../dashboard-icons";
import { PermissionGuard } from "../../../_components/permission-guard";

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBook() {
      try {
        // Fetch book with images. The backend usually provides this in detail view if serializer is nested.
        // We might need to ensure the backend serializer for 'retrieve' is detail-oriented.
        const data = await apiClient<any>(`/books/${id}/`);
        setBook(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch book details");
      } finally {
        setLoading(false);
      }
    }
    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-[#3f6815] border-t-transparent" />
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest font-battambang">កំពុងបើកឯកសារសៀវភៅ...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl bg-red-50 p-8 text-center border border-red-100">
          <h2 className="text-xl font-bold text-red-600 mb-2 font-battambang">កំហុសឧបករណ៍កែប្រែ</h2>
          <p className="text-sm font-medium text-red-500 font-battambang">{error || "រកមិនឃើញសៀវភៅទេ"}</p>
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
    <PermissionGuard resource="books" action="can_edit">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang">កែប្រែសៀវភៅរឿង</h1>
        </div>

        <BookForm
          initialData={book}
          onSuccess={() => router.push("/dashboard/books")}
          onCancel={() => router.back()}
        />
      </div>
    </PermissionGuard>
  );
}
