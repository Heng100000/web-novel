"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Disc, Sparkles, Gift, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function SpinWheelButton() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const { user, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rewards = [
    { label: "៥ ពិន្ទុ", color: "#3b6016" },
    { label: "១០ ពិន្ទុ", color: "#f59e0b" },
    { label: "២០ ពិន្ទុ", color: "#3b6016" },
    { label: "៣០ ពិន្ទុ", color: "#f59e0b" },
    { label: "Coupon ១០០០០៛", color: "#3b6016" },
    { label: "សៀវភៅមួយក្បាល", color: "#f59e0b" },
  ];

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const canSpin = user && (user.reward_points || 0) >= 10;

  const handleSpin = async () => {
    if (!user) {
      toast.error("សូមចូលប្រើប្រាស់ជាមុនសិន ដើម្បីបង្វិលយករង្វាន់");
      return;
    }
    if (!canSpin) {
      toast.error("អ្នកត្រូវការយ៉ាងតិច ១០ ពិន្ទុ ដើម្បីបង្វិលកង់នាំសំណាង");
      return;
    }
    if (isSpinning) return;
    
    try {
      setIsSpinning(true);
      setResult(null);

      // 1. Call Backend to start spin, deduct points and get result
      const { apiClient } = await import("@/lib/api-client");
      const response = await apiClient<any>("/users/spin-wheel/", {
        method: "POST"
      });

      if (response.status === "success") {
        const winningLabel = response.reward_label;
        const index = rewards.findIndex(r => r.label === winningLabel);
        
        if (index === -1) throw new Error("Invalid reward received");

        // 2. Calculate precise rotation
        const segmentSize = 360 / rewards.length;
        // Current pointer is at top (0deg). 
        // Segment 0 is from 0 to 60. Center is 30.
        // To make segment i stop at top, we need to rotate wheel by (360 - (i * 60 + 30))
        const targetAngle = (360 - (index * segmentSize + segmentSize / 2));
        const extraRotations = 360 * 5; // 5 full spins
        const newRotation = rotation + extraRotations + (targetAngle - (rotation % 360));
        
        setRotation(newRotation);

        // 3. Wait for animation to finish
        setTimeout(async () => {
          setIsSpinning(false);
          setResult(winningLabel);
          
          // Refresh user points in context
          await refreshUser();
          
          if (response.win_points > 0) {
            toast.success(`អបអរសាទរ! អ្នកបានឈ្នះ ${winningLabel}`);
          } else {
            toast.success(`អបអរសាទរ! អ្នកទទួលបាន ${winningLabel}`);
          }
        }, 4000);
      }
    } catch (error: any) {
      setIsSpinning(false);
      toast.error(error.message || "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត");
    }
  };

  // Don't show on admin or auth pages
  const excludedPrefixes = ["/login", "/register", "/dashboard", "/admin"];
  const isHiddenPage = excludedPrefixes.some(prefix => pathname?.startsWith(prefix));

  if (!mounted || isHiddenPage) return null;

  return (
    <>
      <div className="fixed bottom-24 right-4 md:bottom-10 md:right-10 z-40">
        <motion.button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ scale: 0, opacity: 0, x: 20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative group flex size-12 md:size-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 shadow-lg shadow-amber-500/30"
        >
          {/* Spinning Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-transparent animate-spin-slow" />
          
          {/* Sparkles on hover */}
          {isHovered && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-2 -right-2 text-yellow-200"
              >
                <Sparkles className="size-4" />
              </motion.div>
            </>
          )}

          {/* Main Spinning Icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          >
            <Disc className="size-6 md:size-7 text-white drop-shadow-md" />
          </motion.div>

          {/* Floating Label on Hover */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: -20 }}
              className="absolute right-full mr-2 whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-amber-400 shadow-xl border border-amber-500/20"
            >
              បង្វិលយករង្វាន់
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Premium Spin Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSpinning && setIsOpen(false)}
              className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
            >
              {/* Modal Header */}
              <div className="bg-[#3b6016] p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <button 
                  onClick={() => setIsOpen(false)}
                  disabled={isSpinning}
                  className="absolute right-6 top-6 size-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-0"
                >
                  <X className="size-4" />
                </button>
                
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="inline-flex size-16 items-center justify-center rounded-2xl bg-white/10 mb-4"
                >
                  <Gift className="size-8 text-amber-400" />
                </motion.div>
                <h3 className="text-2xl font-black font-hanuman">កង់រង្វិលនាំសំណាង</h3>
                <div className="mt-2 flex flex-col items-center gap-1">
                   <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Spin to win premium rewards</p>
                   {user && (
                     <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                        <span className="text-amber-400 text-xs font-black">{user.reward_points.toLocaleString()} {user.reward_points <= 1 ? "Point" : "Points"}</span>
                     </div>
                   )}
                </div>
              </div>

              <div className="p-8 flex flex-col items-center">
                {/* The Wheel Container */}
                <div className="relative size-72 mb-10 p-2 bg-white rounded-full shadow-2xl border-8 border-[#3b6016]/10">
                  {/* Decorative Outer Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#3b6016]/20 animate-spin-slow opacity-30" />
                  
                  {/* Pointer */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-md">
                    <div className="w-8 h-10 bg-[#3b6016] relative flex items-center justify-center rounded-t-sm" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}>
                       <div className="size-2 bg-white/30 rounded-full mb-4" />
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: rotation }}
                    transition={{ duration: 4, ease: [0.15, 0, 0.15, 1] }}
                    className="size-full rounded-full border-4 border-white shadow-2xl overflow-hidden relative"
                    style={{
                      background: `conic-gradient(
                        ${rewards.map((r, i) => `${i % 2 === 0 ? '#3b6016' : '#f59e0b'} ${i * (360 / rewards.length)}deg ${(i + 1) * (360 / rewards.length)}deg`).join(', ')}
                      )`
                    }}
                  >
                    {/* Labels - Wrapping for long text */}
                    {rewards.map((reward, i) => {
                      const angle = 360 / rewards.length;
                      return (
                        <div
                          key={i}
                          className="absolute top-0 left-0 w-full h-1/2 origin-bottom flex justify-center pt-4"
                          style={{ 
                            transform: `rotate(${i * angle + angle / 2}deg)`,
                          }}
                        >
                           <span className={`text-[11px] font-black tracking-tight font-battambang leading-tight text-center max-w-[70px] drop-shadow-sm ${i % 2 === 0 ? 'text-white' : 'text-[#3b6016]'}`}
                                 style={{ transform: 'rotate(0deg)' }}>
                              {reward.label}
                           </span>
                        </div>
                      );
                    })}
                    
                    {/* Segment Lines for clarity */}
                    {rewards.map((_, i) => (
                      <div 
                        key={i}
                        className="absolute top-0 left-1/2 w-[2px] h-1/2 origin-bottom bg-white/20"
                        style={{ transform: `translateX(-50%) rotate(${i * (360 / rewards.length)}deg)` }}
                      />
                    ))}

                    {/* Center Decoration */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="size-14 rounded-full bg-white shadow-xl flex items-center justify-center p-1 border-4 border-zinc-50">
                        <div className="size-full rounded-full bg-gradient-to-tr from-[#3b6016] to-[#4d7c1d] flex items-center justify-center">
                           <Disc className="size-5 text-amber-400 animate-spin-slow" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Result Display */}
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center mb-6"
                    >
                      <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Congratulations!</p>
                      <h4 className="text-2xl font-black text-[#3b6016]">{result}</h4>
                    </motion.div>
                  ) : (
                    <div className="h-[52px] mb-6" /> // Placeholder
                  )}
                </AnimatePresence>

                {/* Spin Button */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="w-full h-14 bg-[#3b6016] rounded-2xl text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#3b6016]/20 transition-all hover:bg-[#2d4a11] active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
                >
                  {isSpinning ? "កំពុងវិល..." : "បង្វិលឥឡូវនេះ"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
