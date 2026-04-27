"use client";

import { ResourceTable } from "../_components/resource-table";
import { IconBooks, IconOrders } from "../dashboard-icons";
import { formatImageUrl } from "@/lib/utils";

export default function BooksPage() {

  return (
    <ResourceTable
      icon={IconBooks}
      title="បញ្ជីសៀវភៅ"
      endpoint="/books/"
      addNewLabel="បន្ថែមសៀវភៅថ្មី"
      resourceKey="books"
      createRoute="/dashboard/books/create"
      columns={[
        { 
          header: "ចំណងជើងសៀវភៅ", 
          accessor: (book: any) => (
            <div className="flex items-center gap-3">
              <div className="size-10 overflow-hidden rounded-lg bg-bg-soft ring-1 ring-border-dim/50">
                {book.images && book.images.length > 0 ? (
                  <img 
                    src={formatImageUrl(book.images.find((img: any) => img.is_main)?.image_url || book.images[0]?.image_url)} 
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-text-dim/40">
                    គ្មានរូបភាព
                  </div>
                )}
              </div>
              <div>
                <div className="font-bold text-text-main font-battambang">{book.title}</div>
                <div className="text-[10px] uppercase tracking-wider text-text-dim/60">កូដ: {book.id.toString().padStart(4, "0")}</div>
              </div>
            </div>
          )
        },
        { header: "ISBN", accessor: "isbn" },
        { 
          header: "តម្លៃលក់", 
          accessor: (book: any) => {
            const price = parseFloat(book.price);
            const discountedPrice = parseFloat(book.discounted_price || book.price);
            const priceRiel = parseFloat(book.price_riel || "0");
            const discountedPriceRiel = parseFloat(book.discounted_price_riel || book.price_riel || "0");
            
            const hasDiscount = discountedPrice < price;

            return (
              <div className="flex flex-col gap-1">
                {/* Riel Price */}
                <div className="flex flex-col">
                  {hasDiscount && (
                    <span className="text-[10px] font-bold text-text-dim/40 line-through">
                      {Math.round(priceRiel).toLocaleString()}៛
                    </span>
                  )}
                  <span className={`text-sm font-black ${hasDiscount ? "text-emerald-600 dark:text-emerald-400" : "text-text-main"}`}>
                    {Math.round(discountedPriceRiel).toLocaleString()}៛
                  </span>
                </div>

                {/* USD Price */}
                <div className="flex items-center gap-1.5 opacity-60">
                  {hasDiscount && (
                    <span className="text-[9px] font-bold text-text-dim/40 line-through">
                      ${price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-text-main">
                    ${discountedPrice.toFixed(2)}
                  </span>
                </div>

                {hasDiscount && (
                  <div className="mt-1">
                    <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[8px] font-black text-amber-600 ring-1 ring-amber-500/20 uppercase tracking-tighter">
                      បញ្ចុះតម្លៃពិសេស
                    </span>
                  </div>
                )}
              </div>
            );
          }
        },
        { 
          header: "ស្តុក", 
          accessor: (book: any) => (
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${book.stock_qty < 10 ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
              <span className={`font-bold ${book.stock_qty < 10 ? "text-red-500" : "text-text-dim"}`}>
                {book.stock_qty} <span className="text-[10px] font-medium text-text-dim/60 font-battambang">ច្បាប់</span>
              </span>
            </div>
          ) 
        },
        { 
          header: "ស្ថានភាព", 
          accessor: (book: any) => (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${book.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20" : "bg-bg-soft text-text-dim ring-1 ring-border-dim/50"}`}>
              <span className={`h-1 w-1 rounded-full ${book.is_active ? "bg-emerald-600 dark:bg-emerald-400" : "bg-text-dim/40"}`} />
              {book.is_active ? "កំពុងលក់" : "បញ្ឈប់ការលក់"}
            </span>
          ) 
        },
      ]}
    />

  );
}
