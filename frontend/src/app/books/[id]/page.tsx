import BookDetailClient from "./book-detail-client";
import { Metadata } from "next";
import { decodeId } from "@/lib/id-obfuscator";

async function getBookData(encodedId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.our-novel.com/api";
  
  // Try to decode if it's not a direct number
  const decodedId = decodeId(encodedId) || encodedId;
  
  try {
    const res = await fetch(`${baseUrl}/books/${decodedId}/`, { 
      next: { revalidate: 60 },
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching book:", error);
    return null;
  }
}

async function getSimilarBooks(categoryId: number, currentBookId: number) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.our-novel.com/api";
  
  try {
    const res = await fetch(`${baseUrl}/books/?category=${categoryId}&limit=5`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || [];
    // Filter out the current book
    return results.filter((b: any) => b.id !== currentBookId);
  } catch (error) {
    console.error("Error fetching similar books:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookData(id);
  if (!book) return { title: "សៀវភៅមិនត្រូវបានរកឃើញ" };

  return {
    title: `${book.title} | Our Novel`,
    description: book.description?.substring(0, 160),
  };
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookData(id);

  if (!book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-black text-zinc-800">សៀវភៅមិនត្រូវបានរកឃើញ</h1>
        <p className="text-zinc-500 font-bold">សូមអភ័យទោស សៀវភៅដែលអ្នកស្វែងរកមិនមាននៅក្នុងប្រព័ន្ធទេ។</p>
        <a href="/books" className="rounded-full bg-[#3b6016] px-6 py-3 text-sm font-black text-white shadow-xl hover:opacity-90">
          ត្រឡប់ទៅមើលសៀវភៅទាំងអស់
        </a>
      </div>
    );
  }

  const similarBooks = await getSimilarBooks(book.category, book.id);

  return <BookDetailClient book={book} similarBooks={similarBooks} />;
}
