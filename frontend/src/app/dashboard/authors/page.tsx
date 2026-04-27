"use client";

import { ResourceTable } from "../_components/resource-table";
import { IconPen } from "../dashboard-icons";
import { formatImageUrl } from "@/lib/utils";

export default function AuthorsPage() {
  return (
    <ResourceTable
      icon={IconPen}
      title="អ្នកនិពន្ធ"
      endpoint="/authors/"
      addNewLabel="បន្ថែមអ្នកនិពន្ធថ្មី"
      resourceKey="authors"
      createRoute="/dashboard/authors/create"
      columns={[
        { 
          header: "អ្នកនិពន្ធ", 
          accessor: (author: any) => (
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-orange-500/10 text-orange-600 ring-2 ring-orange-500/20">
                {author.photo_url ? (
                  <img 
                    src={formatImageUrl(author.photo_url)} 
                    alt={author.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest">{author.name[0]}</span>
                )}
              </div>
              <div>
                <div className="font-bold text-text-main font-battambang">
                  {author.name_km && <span className="mr-1">{author.name_km}</span>}
                  {author.name && <span className="text-text-dim font-medium text-[12px]">({author.name})</span>}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-text-dim/60">អ្នកនិពន្ធកិត្តិយស</div>
              </div>
            </div>
          )
        },
        { 
          header: "ជីវប្រវត្តិសង្ខេប", 
          accessor: (author: any) => (
            <div className="max-w-md line-clamp-2 text-text-dim italic text-[13px] leading-relaxed font-battambang">
              {author.biography_km || author.biography || "មិនទាន់មានជីវប្រវត្តិនៅឡើយទេ។"}
            </div>
          ) 
        },
      ]}
    />


  );
}
