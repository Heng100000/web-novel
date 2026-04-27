export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="relative flex flex-col items-center gap-6">
        {/* Animated Logo or Spinner */}
        <div className="relative size-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#3b6016]/10" />
          <div className="absolute inset-0 rounded-full border-4 border-[#3b6016] border-t-transparent animate-spin" />
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-black text-[#3b6016] font-khmer animate-pulse">
            កំពុងដំណើរការ...
          </h2>
          <p className="text-zinc-400 text-sm font-medium">
            សូមរង់ចាំបន្តិច
          </p>
        </div>
      </div>
      
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#3b6016]/5 overflow-hidden">
        <div className="h-full bg-[#3b6016] animate-progress-indeterminate w-[30%] rounded-full" />
      </div>
    </div>
  );
}
