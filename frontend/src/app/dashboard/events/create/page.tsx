"use client";

import { useRouter } from "next/navigation";
import { EventForm } from "../../_components/forms/event-form";
import { IconEvents } from "../../dashboard-icons";

export default function CreateEventPage() {
  const router = useRouter();
  const handleSuccess = () => {
    router.push("/dashboard/events");
    router.refresh();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="w-full pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang">បង្កើតព្រឹត្តិការណ៍ថ្មី</h1>
          </div>
        </div>
        
      </div>

      <EventForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
