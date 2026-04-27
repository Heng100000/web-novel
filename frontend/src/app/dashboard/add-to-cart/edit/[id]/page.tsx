"use client";

import { useEffect, useState, use } from "react";
import { apiClient } from "@/lib/api-client";
import { AddToCartEditForm } from "../../../_components/forms/add-to-cart-edit-form";
import { IconBooks, IconOrders } from "../../../dashboard-icons";
import Link from "next/link";

interface EditCartPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCartPage({ params }: EditCartPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiClient<any>(`/add-to-cart/${id}/`);
        setInitialData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load record");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex size-12 animate-spin items-center justify-center rounded-full border-4 border-zinc-100 border-t-[#3f6815]" />
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading record details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 py-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-text-main uppercase">Edit Record</h1>
        <p className="text-sm font-bold text-text-dim">Update cart entry for tracking</p>
      </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-red-100 bg-red-50/30 py-20">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <IconOrders className="size-8" />
          </div>
          <h2 className="text-lg font-black text-red-600 uppercase mb-2">Access Denied or Not Found</h2>
          <p className="text-sm font-bold text-red-500/70 mb-8">{error}</p>
          <Link 
            href="/dashboard/add-to-cart" 
            className="inline-flex rounded-xl bg-red-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all"
          >
            Back to List
          </Link>
        </div>
      ) : (
        initialData && <AddToCartEditForm id={id} initialData={initialData} />
      )}
    </div>
  );
}
