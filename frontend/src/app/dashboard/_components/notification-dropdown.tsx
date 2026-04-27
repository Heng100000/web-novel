"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { IconCheck, IconBell } from "../dashboard-icons";
import { apiClient } from "@/lib/api-client";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient("/notifications/");
      setNotifications(Array.isArray(res) ? res : res.results || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient(`/notifications/${id}/mark_as_read/`, { method: "POST" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient(`/notifications/mark_all_as_read/`, { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "មុននេះបន្តិច";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} នាទីមុន`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ម៉ោងមុន`;
    return `${Math.floor(diffInSeconds / 86400)} ថ្ងៃមុន`;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div 
      ref={containerRef}
      className="absolute right-0 top-full mt-3 z-50 w-[90vw] max-w-[400px] origin-top-right animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Unique Minimalist Panel - Solid & Sharp */}
      <div className="relative overflow-hidden rounded-[16px] border border-border-dim bg-card-bg shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)]">
        
        {/* Header - Sharp & Functional */}
        <div className="flex items-center justify-between border-b border-border-dim/40 px-6 py-5 bg-card-bg">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[17px] font-black tracking-tight text-text-main font-battambang">ដំណឹងថ្មីៗ</h2>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-md bg-primary/10 px-1 text-[11px] font-black text-primary">{unreadCount}</span>
            )}
          </div>
          <button 
            onClick={markAllAsRead}
            className="text-[13px] font-black text-text-dim hover:text-primary transition-colors font-battambang"
          >
            អានទាំងអស់
          </button>
        </div>

        {/* List - Integrated Minimalist View */}
        <div className="max-h-[460px] overflow-y-auto scrollbar-none divide-y divide-border-dim/30">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-dim opacity-40">
              <div className="size-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-3" />
              <p className="text-[11px] font-black uppercase tracking-widest font-battambang">កំពុងផ្ទុក...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-dim/30">
              <IconBell className="size-12 mb-4 opacity-20" />
              <p className="text-[13px] font-black uppercase tracking-widest font-battambang">មិនទាន់មានដំណឹងឡើយ</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div 
                key={item.id} 
                onClick={() => !item.is_read && markAsRead(item.id)}
                className={`group relative flex gap-4 p-5 transition-all hover:bg-bg-soft/30 cursor-pointer ${
                  !item.is_read ? "bg-primary/[0.02]" : ""
                }`}
              >
                {/* Unique Unread Accent Bar */}
                {!item.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                )}

                {/* Avatar Section - Sharp Squircle */}
                <div className="relative shrink-0">
                  <div className={`flex size-12 items-center justify-center rounded-[12px] ring-1 ring-border-dim/50 shadow-sm ${
                    item.type === 'coupon_used' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-bg-soft text-primary'
                  }`}>
                    {item.type === 'coupon_used' ? (
                      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4v-3a2 2 0 00-2-2H5z" />
                      </svg>
                    ) : (
                      <IconBell className="size-6" />
                    )}
                  </div>
                  {!item.is_read && (
                    <div className="absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-card-bg bg-primary shadow-sm" />
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-black text-text-main truncate">{item.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim/40 font-battambang shrink-0">
                      {formatTime(item.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-[13px] leading-relaxed text-text-dim font-medium line-clamp-2">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer - Integrated Action */}
        <div className="bg-bg-soft/20 border-t border-border-dim/40 p-4">
          <Link 
            href="/dashboard/notifications"
            className="block w-full rounded-xl bg-card-bg border border-border-dim/60 py-3 text-center text-[13px] font-black text-text-main transition-all hover:bg-bg-soft active:scale-[0.98] font-battambang"
          >
            មើលដំណឹងទាំងអស់
          </Link>
        </div>
      </div>
    </div>
  );
}

