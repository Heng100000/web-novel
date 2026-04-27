"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { EventForm } from "../../../_components/forms/event-form";
import { IconEvents } from "../../../dashboard-icons";

export default function EditEventPage() {
  const router = useRouter();
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient(`/events/${id}/`)
      .then(res => {
        setEvent(res);
        setLoading(false);
      })
      .catch(() => {
        router.push("/dashboard/events");
      });
  }, [id, router]);

  const handleSuccess = () => {
    router.push("/dashboard/events");
    router.refresh();
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3f6815] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang">កែប្រែព្រឹត្តិការណ៍</h1>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={handleCancel}
            className="btn-secondary"
          >
            បោះបង់ការផ្លាស់ប្តូរ
          </button>
        </div>
      </div>

      <EventForm 
        initialData={event}
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </div>
  );
}
