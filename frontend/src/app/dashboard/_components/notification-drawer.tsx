"use client";

import React, { useEffect, useState } from "react";
import { IconBell, IconChevronRight, IconCheck } from "../dashboard-icons";

interface Notification {
  id: number;
  title: string;
  description: string;
  time: string;
  type: "info" | "success" | "warning";
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "ការបញ្ជាទិញថ្មី #ORD-4502",
    description: "លោក សុខ ហេង បានបញ្ជាទិញសៀវភៅ 'កូនក្រមុំឆ្នាស' ចំនួន ២ ក្បាល។",
    time: "២ នាទីមុន",
    type: "success",
    isRead: false,
  },
  {
    id: 2,
    title: "ស្តុកសៀវភៅជិតអស់",
    description: "សៀវភៅ 'ការចងចាំមួយនោះ' នៅសល់តែ ៥ ក្បាលប៉ុណ្ណោះក្នុងស្តុក។",
    time: "១ ម៉ោងមុន",
    type: "warning",
    isRead: false,
  },
  {
    id: 3,
    title: "ការចុះឈ្មោះអ្នកនិពន្ធថ្មី",
    description: "អ្នកនិពន្ធ 'ម៉ៅ សំណាង' ត្រូវបានបន្ថែមទៅក្នុងប្រព័ន្ធ។",
    time: "៣ ម៉ោងមុន",
    type: "info",
    isRead: true,
  },
  {
    id: 4,
    title: "យុទ្ធនាការបញ្ចុះតម្លៃ",
    description: "ព្រឹត្តិការណ៍ 'ចូលឆ្នាំខ្មែរ' នឹងចាប់ផ្តើមក្នុងពេល ២ ថ្ងៃទៀត។",
    time: "៥ ម៉ោងមុន",
    type: "info",
    isRead: true,
  },
];

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop with extreme blur */}
      <div 
        className={`fixed inset-0 z-[140] bg-zinc-950/30 backdrop-blur-[8px] transition-all duration-700 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Floating Drawer Container */}
      <aside 
        className={`fixed inset-y-0 right-0 z-[150] w-full max-w-[420px] p-4 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) transform ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-zinc-700/50 bg-card-bg/95 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] backdrop-blur-2xl ring-1 ring-black/5">
          {/* Header Area */}
          <div className="relative overflow-hidden border-b border-grayborde/40 px-8 py-8">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -left-4 -bottom-4 size-24 rounded-full bg-emerald-500/5 blur-2xl" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner">
                  <IconBell className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-text-main font-battambang tracking-tight">សេចក្តីជូនដំណឹង</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-text-dim/70 font-battambang">ដំណឹងថ្មីៗសម្រាប់អ្នក</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="flex size-10 items-center justify-center rounded-full bg-bg-soft/50 text-text-dim hover:bg-bg-soft hover:text-text-main hover:scale-110 active:scale-95 transition-all shadow-sm"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Notification List with Stagger Entry Effect */}
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-none">
            <div className="space-y-4 pt-2">
              {MOCK_NOTIFICATIONS.map((notif, index) => (
                <div 
                  key={notif.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className={`group relative flex flex-col gap-3 rounded-2xl p-5 transition-all hover:bg-bg-soft/40 hover:shadow-xl hover:shadow-black/5 cursor-pointer border border-transparent hover:border-grayborde/50 active:scale-[0.98] animate-in fade-in slide-in-from-right-4 duration-700 ${
                    !notif.isRead ? "bg-primary/5 ring-1 ring-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 
                        notif.type === 'warning' ? 'bg-amber-500/10 text-amber-600' : 
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {notif.type === 'success' ? <IconCheck className="size-4" /> : <IconBell className="size-4" />}
                      </div>
                      <h3 className="text-sm font-black text-text-main font-battambang leading-none">{notif.title}</h3>
                    </div>
                    <span className="text-[10px] font-black text-text-dim/40 uppercase tracking-tighter">{notif.time}</span>
                  </div>
                  
                  <p className="text-[13px] font-bold text-text-dim/80 font-battambang leading-relaxed pl-[36px]">
                    {notif.description}
                  </p>

                  <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                    <IconChevronRight className="size-4 text-primary" />
                  </div>

                  {!notif.isRead && (
                    <div className="absolute top-2 right-2 size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(63,104,21,0.5)]" />
                  )}
                </div>
              ))}
            </div>

            {MOCK_NOTIFICATIONS.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="size-24 rounded-full bg-bg-soft/50 flex items-center justify-center text-text-dim/10 mb-6 shadow-inner">
                  <IconBell className="size-12" />
                </div>
                <h3 className="text-base font-black text-text-main font-battambang">មិនមានការជូនដំណឹងថ្មី</h3>
                <p className="text-sm text-text-dim/60 mt-2 max-w-[200px] font-medium font-battambang leading-relaxed">រាល់ដំណឹងថ្មីៗទាក់ទងនឹងបណ្ណាល័យនឹងបង្ហាញនៅទីនេះ</p>
              </div>
            )}
          </div>

          {/* Footer Actions with premium button style */}
          <div className="border-t border-grayborde/40 bg-bg-soft/30 p-8">
            <button className="relative w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-primary text-white font-black font-battambang shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
              <IconCheck className="size-5" />
              <span>សម្គាល់ថាបានអានទាំងអស់</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
