"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";

export default function VisitorTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Check if we've already tracked this session
    const sessionKey = "last_track_date";
    const today = new Date().toISOString().split('T')[0];
    const lastTrack = sessionStorage.getItem(sessionKey);

    // If already tracked today in this session, don't track again (handles reload)
    if (lastTrack === today) return;
    
    const trackVisit = async () => {
      try {
        await apiClient("/track-visit/", {
          method: "POST",
        });
        // Mark as tracked for this session
        sessionStorage.setItem(sessionKey, today);
      } catch (error) {
        console.debug("Failed to track visit", error);
      }
    };

    const timeout = setTimeout(trackVisit, 2000);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}
