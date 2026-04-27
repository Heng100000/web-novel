"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

export function Modal({ isOpen, onClose, title, children, size = '2xl' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen && !mounted) return null;
  if (!mounted) return null;

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[150] flex items-center justify-center p-4 transition-all duration-500 ${
        isOpen ? "opacity-100 backdrop-blur-md" : "pointer-events-none opacity-0 backdrop-blur-none"
      }`}
    >
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-zinc-950/40 transition-opacity duration-500" 
        onClick={onClose}
      />
      
      {/* Container */}
      <div 
        className={`relative w-full transform rounded-2xl bg-card-bg p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-filament-border transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] sm:p-8 ${
          size === 'md' ? 'max-w-md' :
          size === 'lg' ? 'max-w-lg' :
          size === 'xl' ? 'max-w-xl' :
          size === '2xl' ? 'max-w-2xl' :
          size === '4xl' ? 'max-w-4xl' :
          size === '6xl' ? 'max-w-6xl' : 'max-w-2xl'
        } ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-90 opacity-0"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-text-main uppercase">{title}</h3>
            <div className="mt-1 h-1.5 w-16 rounded-full bg-primary shadow-sm shadow-primary/20" />
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl p-2.5 text-text-dim transition-all hover:bg-bg-soft hover:text-text-main active:scale-90"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
