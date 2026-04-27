"use client";

import { ResourceTable } from "../_components/resource-table";
import { IconTags } from "../dashboard-icons";

export default function CategoriesPage() {
  return (
    <ResourceTable
      icon={IconTags}
      title="ប្រភេទសៀវភៅ"
      endpoint="/categories/"
      addNewLabel="បន្ថែមប្រភេទថ្មី"
      resourceKey="categories"
      createRoute="/dashboard/categories/create"
      columns={[
        { 
          header: "ឈ្មោះប្រភេទ", 
          accessor: (cat: any) => (
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20">
                <IconTags className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-text-main leading-tight font-battambang">{cat.name_km || cat.name}</span>
                {cat.name_km && cat.name && <span className="text-[11px] font-bold text-text-dim uppercase">({cat.name})</span>}
              </div>
            </div>
          ) 
        },
        { 
          header: "Slug ប្រព័ន្ធ", 
          accessor: (cat: any) => (
            <code className="rounded-lg bg-bg-soft px-2 py-1 text-[11px] font-bold text-text-dim ring-1 ring-border-dim/50">
              /{cat.slug}
            </code>
          )
        },
        { 
          header: "ភាពមើលឃើញ", 
          accessor: () => (
            <div className="flex gap-1">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 font-battambang">សាធារណៈ</span>
            </div>
          )
        }
      ]}
    />


  );
}
