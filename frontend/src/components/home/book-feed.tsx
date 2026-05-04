"use client";

import { IconSearch } from "@/app/dashboard/dashboard-icons";
import BookCard from "../book-card";

interface BookFeedProps {
  books: any[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  mobileCols: 1 | 2 | 3;
  favoriteIds?: Set<number>;
}

export default function BookFeed({
  books,
  loading,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  mobileCols,
  favoriteIds = new Set<number>()
}: BookFeedProps) {
  const getGridTemplate = (cols: number) => {
    if (cols === 3) return '1fr 1fr 1fr';
    if (cols === 2) return '1fr 1fr';
    return '1fr';
  };

  return (
    <div className="flex flex-col">

      {/* Grid */}
      {loading ? (
        <div
          key={`loading-${mobileCols}`}
          className={`grid gap-2 sm:gap-4 md:grid-cols-4 lg:grid-cols-4 ${mobileCols === 3 ? "grid-cols-3" : mobileCols === 2 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : books.length > 0 ? (
        <div
          key={`grid-${mobileCols}`}
          className={`grid gap-2 sm:gap-4 md:grid-cols-4 lg:grid-cols-4 ${mobileCols === 3 ? "grid-cols-3" : mobileCols === 2 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {/* Debug Info: {mobileCols} columns */}
          {books.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              price={book.price}
              price_riel={book.price_riel}
              discounted_price={book.discounted_price}
              discounted_price_riel={book.discounted_price_riel}
              discount_percentage={book.discount_percentage}
              discount_type={book.discount_type}
              discount_value={book.discount_value}
              image_url={book.image_url}
              author_name={book.author_details?.name_km || book.author_details?.name}
              event_title={book.event_title}
              edition_type={book.edition_type}
              mobileCols={mobileCols}
              isInitialFavorite={favoriteIds.has(book.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-20 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4">
            <IconSearch className="size-10" />
          </div>
          <h3 className="text-lg font-black text-zinc-900">រកមិនឃើញសៀវភៅ</h3>
          <p className="text-sm font-bold text-zinc-400">សូមសាកល្បងស្វែងរកពាក្យផ្សេង ឬប្តូរការ Filter។</p>
        </div>
      )}
    </div>
  );
}
