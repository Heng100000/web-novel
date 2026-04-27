"use client";

import { ResourceTable } from "../_components/resource-table";
import { IconEvents } from "../dashboard-icons";
import { EventForm } from "../_components/forms/event-form";
import { formatDate } from "@/lib/utils";

export default function EventsPage() {
  return (
    <ResourceTable
      icon={IconEvents}
      title="ព្រឹត្តិការណ៍ផ្សព្វផ្សាយ"
      endpoint="/events/"
      addNewLabel="បន្ថែមព្រឹត្តិការណ៍ថ្មី"
      resourceKey="events"
      createRoute="/dashboard/events/create"
      columns={[
        { 
          header: "ចំណងជើងកម្មវិធី", 
          accessor: "title" 
        },
        { 
          header: "ការបញ្ចុះតម្លៃ", 
          accessor: (event: any) => (
            <span className="font-black text-primary dark:text-emerald-500 bg-primary/5 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              {event.discount_type === 'Fixed Amount' ? (
                `ចុះ -${Math.round(event.discount_value || 0).toLocaleString()}៛`
              ) : (
                `ចុះ -${event.discount_percentage}%`
              )}
            </span>
          ) 
        },
        { 
          header: "ចាប់ផ្ដើម", 
          accessor: (event: any) => formatDate(event.start_date)
        },
        { 
          header: "បញ្ចប់", 
          accessor: (event: any) => {
            const end = new Date(event.end_date);
            const now = new Date();
            const isExpired = end < now;
            return (
              <span className={isExpired ? "text-red-500 font-medium" : "text-text-dim font-medium font-battambang"}>
                {formatDate(event.end_date)}
                {isExpired && " (ហួសកំណត់)"}
              </span>
            );
          }
        },
        { 
          header: "ស្ថានភាព", 
          accessor: (event: any) => (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${event.status === 'Active' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20" : "bg-bg-soft text-text-dim ring-1 ring-border-dim/50"} font-battambang`}>
              <span className={`h-1 w-1 rounded-full ${event.status === 'Active' ? "bg-emerald-600 dark:bg-emerald-400" : "bg-text-dim/40"}`} />
              {event.status === 'Active' ? "សកម្ម" : "អសកម្ម"}
            </span>
          ) 
        },
      ]}
    />

  );
}
