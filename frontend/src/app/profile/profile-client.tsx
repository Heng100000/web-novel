"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import { User, Mail, Phone, MapPin, Award, Star, Shield, Loader2, Disc } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export default function ProfileClient() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [reward, setReward] = useState<any>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);

  const rewards = [
    { id: 1, text: "ឈ្នះ ២ ពិន្ទុ", points: 2, color: "#3b6016" },
    { id: 2, text: "ឈ្នះ ៥ ពិន្ទុ", points: 5, color: "#a3b18a" },
    { id: 3, text: "ឈ្នះ ១០ ពិន្ទុ", points: 10, color: "#3b6016" },
    { id: 4, text: "ឈ្នះ ១៥ ពិន្ទុ", points: 15, color: "#a3b18a" },
    { id: 5, text: "ឈ្នះ ២០ ពិន្ទុ", points: 20, color: "#3b6016" },
    { id: 6, text: "ព្យាយាមម្តងទៀត", points: 0, color: "#71717a" },
  ];

  const handleSpin = async () => {
    // For testing purposes, allow spinning even with insufficient points
    if (!user) return;
    /*
    if (!user || user.reward_points < 10) {
      toast.error("អ្នកមិនមានពិន្ទុគ្រប់គ្រាន់សម្រាប់ការបង្វិលទេ (ត្រូវការ ១០ ពិន្ទុ)");
      return;
    }
    */

    if (isSpinning) return;

    setIsSpinning(true);
    const basePoints = user.reward_points - 10;
    
    const randomIndex = Math.floor(Math.random() * rewards.length);
    const selectedReward = rewards[randomIndex];
    
    const segmentAngle = 360 / rewards.length;
    const rewardAngle = 360 - (randomIndex * segmentAngle) - (segmentAngle / 2);
    const newAngle = spinAngle + (360 * 10) + rewardAngle - (spinAngle % 360);
    
    setSpinAngle(newAngle);

    setTimeout(async () => {
      setIsSpinning(false);
      setReward(selectedReward);
      setShowRewardModal(true);
      
      const finalPoints = basePoints + selectedReward.points;
      
      try {
        await apiClient(`/users/me/`, {
          method: "PATCH",
          body: JSON.stringify({ reward_points: finalPoints }),
        });
        
        await refreshUser();
      } catch (error) {
        console.error("Failed to update reward points:", error);
        toast.error("មានបញ្ហាក្នុងការរក្សាទុកពិន្ទុ");
      }
    }, 5000);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-12 text-[#3b6016] animate-spin" />
            <p className="text-zinc-500 font-bold font-khmer">កំពុងទាញយកទិន្នន័យ...</p>
          </div>
        </div>
        <BottomNav />
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Get Initials for Avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <Navbar />

      <main className="flex-grow pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header/Banner Section with Glassmorphism */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#3b6016] to-[#a3b18a] p-8 md:p-12 shadow-2xl mb-8 animate-fade-in-up">
            {/* Decorative background shapes */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 size-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 size-60 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Avatar */}
              <div className="size-24 md:size-28 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white text-3xl md:text-4xl font-black shadow-lg">
                {getInitials(user.full_name)}
              </div>
              
              {/* Basic Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl md:text-3xl font-black text-white font-khmer mb-2">
                  {user.full_name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold font-khmer flex items-center gap-1.5 border border-white/10">
                    <Shield className="size-3.5" />
                    {user.role_details?.name_km || user.role_details?.name || "អ្នកប្រើប្រាស់"}
                  </span>
                  {user.email && (
                    <span className="text-white/80 text-sm font-medium flex items-center gap-1.5">
                      <Mail className="size-4" />
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reward Points Card - Premium Look */}
            <div className="md:col-span-1 rounded-2xl bg-white border border-zinc-100 p-6 shadow-xl shadow-zinc-100/50 flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all duration-300 animate-fade-in-up">
              {/* Brand accent line at the top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3b6016] to-[#a3b18a]" />
              
              {/* Background decorative star */}
              <Star className="absolute bottom-0 right-0 -mb-8 -mr-8 size-28 text-[#a3b18a]/10 group-hover:scale-110 transition-transform duration-500" />

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-[#3b6016]/10 text-[#3b6016]">
                    <Award className="size-6" />
                  </div>
                  <h2 className="text-lg font-black text-zinc-700 font-khmer">ពិន្ទុរង្វាន់</h2>
                </div>
                
                <p className="text-xs font-bold text-zinc-400 font-khmer mb-1">ពិន្ទុសរុបរបស់អ្នក</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-[#3b6016] tracking-tight">
                    {user.reward_points || 0}
                  </span>
                  <span className="text-sm font-black text-[#3b6016] font-khmer">ពិន្ទុ</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-50">
                <p className="text-xs font-medium text-zinc-400 leading-relaxed font-khmer">
                  * ប្រើប្រាស់ពិន្ទុរង្វាន់របស់អ្នកដើម្បីទទួលបានការបញ្ចុះតម្លៃបន្ថែមលើការទិញសៀវភៅ។
                </p>
              </div>
            </div>

            {/* Profile Details Card */}
            <div className="md:col-span-2 rounded-2xl bg-white border border-zinc-100 p-6 shadow-xl shadow-zinc-100/50 relative overflow-hidden animate-fade-in-up">
              {/* Green accent line at the top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#3b6016]" />

              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-xl bg-zinc-50 text-zinc-600">
                  <User className="size-6" />
                </div>
                <h2 className="text-lg font-black text-zinc-700 font-khmer">ព័ត៌មានផ្ទាល់ខ្លួន</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="p-2 rounded-lg bg-zinc-100 text-zinc-500 mt-0.5">
                    <User className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-400 font-khmer">ឈ្មោះពេញ</span>
                    <span className="text-sm font-black text-zinc-700 font-khmer">{user.full_name}</span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="p-2 rounded-lg bg-zinc-100 text-zinc-500 mt-0.5">
                    <Mail className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-zinc-400 font-khmer">អ៊ីមែល</span>
                    <span className="text-sm font-black text-zinc-700 truncate">{user.email || "មិនទាន់មាន"}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="p-2 rounded-lg bg-zinc-100 text-zinc-500 mt-0.5">
                    <Phone className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-400 font-khmer">លេខទូរស័ព្ទ</span>
                    <span className="text-sm font-black text-zinc-700">{user.phone || "មិនទាន់មាន"}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="p-2 rounded-lg bg-zinc-100 text-zinc-500 mt-0.5">
                    <MapPin className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-400 font-khmer">អាសយដ្ឋាន</span>
                    <span className="text-sm font-black text-zinc-700 font-khmer">{user.address || "មិនទាន់មាន"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lucky Spin Wheel Section */}
          <div className="mt-8 rounded-2xl bg-white border border-zinc-100 p-6 shadow-xl shadow-zinc-100/50 relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3b6016] to-[#a3b18a]" />

            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Wheel UI */}
              <div className="relative flex items-center justify-center size-64 sm:size-80 shrink-0">
                {/* Pointer */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500 drop-shadow-md" />
                
                {/* The Wheel */}
                <div 
                  className="size-full rounded-full border-4 border-[#3b6016] shadow-2xl relative overflow-hidden"
                  style={{ 
                    transform: `rotate(${spinAngle}deg)`,
                    transition: 'transform 5s cubic-bezier(0.25, 1, 0.5, 1)',
                    background: `conic-gradient(
                      ${rewards[0].color} 0deg 60deg,
                      ${rewards[1].color} 60deg 120deg,
                      ${rewards[2].color} 120deg 180deg,
                      ${rewards[3].color} 180deg 240deg,
                      ${rewards[4].color} 240deg 300deg,
                      ${rewards[5].color} 300deg 360deg
                    )`
                  }}
                >
                  {/* Reward Text on Wheel */}
                  {rewards.map((r, i) => (
                    <div 
                      key={r.id}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full text-center text-white font-black text-[10px] sm:text-xs font-khmer flex items-center justify-center pointer-events-none"
                      style={{ 
                        transform: `rotate(${i * 60 + 30}deg) translateY(-90px)`,
                      }}
                    >
                      <span className="bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {r.points > 0 ? `+${r.points}` : "0"}
                      </span>
                    </div>
                  ))}
                  
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-full bg-white border-4 border-[#a3b18a] shadow-md flex items-center justify-center z-10">
                    <Disc className="size-6 text-[#3b6016]" />
                  </div>
                </div>
              </div>

              {/* Info & Button */}
              <div className="flex-grow text-center md:text-left flex flex-col justify-center">
                <h2 className="text-xl md:text-2xl font-black text-zinc-700 font-khmer mb-2 flex items-center justify-center md:justify-start gap-2">
                  <Award className="size-6 text-[#3b6016]" />
                  បង្វិលកងយករង្វាន់
                </h2>
                <p className="text-sm font-bold text-zinc-500 font-khmer mb-6">
                  ចំណាយត្រឹមតែ <span className="text-red-500">១០ ពិន្ទុ</span> ក្នុងម្នាក់សម្រាប់ការបង្វិលម្តង ដើម្បីមានឱកាសឈ្នះរង្វាន់រហូតដល់ <span className="text-[#3b6016]">២០ ពិន្ទុ</span>!
                </p>

                <button
                  onClick={handleSpin}
                  disabled={isSpinning}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#3b6016] to-[#a3b18a] text-white font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#3b6016]/20 disabled:opacity-50 disabled:cursor-not-allowed font-khmer"
                >
                  {isSpinning ? "កំពុងបង្វិល..." : "បង្វិលឥឡូវនេះ (ចំណាយ ១០ ពិន្ទុ)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reward Success Modal */}
      {showRewardModal && reward && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="size-20 rounded-full bg-[#3b6016]/10 text-[#3b6016] flex items-center justify-center mx-auto mb-6">
              <Award className="size-10" />
            </div>
            
            <h3 className="text-xl font-black text-zinc-800 mb-2 font-khmer">
              {reward.points > 0 ? "អបអរសាទរ!" : "ព្យាយាមម្តងទៀត!"}
            </h3>
            <p className="text-zinc-500 font-bold mb-6 font-khmer">
              {reward.text}
            </p>

            <button
              onClick={() => setShowRewardModal(false)}
              className="w-full py-3 rounded-xl bg-[#3b6016] text-white font-black text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#3b6016]/20 font-khmer"
            >
              បិទ
            </button>
          </div>
        </div>
      )}

      <BottomNav />
      <Footer />
    </div>
  );
}
