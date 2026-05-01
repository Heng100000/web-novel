"use client";

import { Heart } from "lucide-react";

export default function WishlistPage() {
  return (
    <div className="container mx-auto px-4 py-32 min-h-screen flex flex-col items-center justify-center text-center">
      <div className="size-24 rounded-full bg-red-50 flex items-center justify-center text-red-400 mb-6">
        <Heart className="size-12 fill-current" />
      </div>
      <h1 className="text-3xl font-black text-zinc-800 mb-2 font-khmer">បញ្ជីប្រាថ្នា</h1>
      <p className="text-zinc-500 font-bold max-w-md font-khmer">
        ទំព័រនេះកំពុងស្ថិតក្នុងការអភិវឌ្ឍន៍។ អ្នកនឹងអាចរក្សាទុកសៀវភៅដែលអ្នកចូលចិត្តនៅទីនេះក្នុងពេលឆាប់ៗនេះ!
      </p>
    </div>
  );
}
