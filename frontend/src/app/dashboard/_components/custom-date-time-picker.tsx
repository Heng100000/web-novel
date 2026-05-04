"use client";

import { useState, useMemo } from "react";
import { Modal } from "./modal";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconHash } from "../dashboard-icons";

interface CustomDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  min?: string;
  required?: boolean;
}

export function CustomDateTimePicker({ 
  value, 
  onChange, 
  label, 
  min, 
  required = false 
}: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Internal state for the calendar view
  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedTime, setSelectedTime] = useState({
    hours: initialDate.getHours(),
    minutes: initialDate.getMinutes()
  });

  const isPM = selectedTime.hours >= 12;
  const displayHours = selectedTime.hours % 12 || 12;

  // Khmer Months
  const khmerMonths = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
  ];

  // Helper: Format display DD/MM/YYYY HH:mm AM/PM
  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = date.getHours();
    const h12 = hours % 12 || 12;
    const period = hours >= 12 ? "ល្ងាច (PM)" : "ព្រឹក (AM)";
    
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(h12)}:${pad(date.getMinutes())} ${period}`;
  };

  // Helper: Format for ISO string (YYYY-MM-DDTHH:mm)
  const formatISO = (date: Date, hours: number, minutes: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hours)}:${pad(minutes)}`;
  };

  // Calendar Logic
  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    
    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Actual days
    for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: Date) => {
    const newValue = formatISO(date, selectedTime.hours, selectedTime.minutes);
    onChange(newValue);
  };

  const handleTimeChange = (type: 'hours' | 'minutes' | 'period', val: string | boolean) => {
    let newHours = selectedTime.hours;
    let newMinutes = selectedTime.minutes;

    if (type === 'hours') {
      const h = Math.max(1, Math.min(12, parseInt(val as string) || 1));
      const currentIsPM = selectedTime.hours >= 12;
      newHours = currentIsPM ? (h % 12) + 12 : h % 12;
    } else if (type === 'minutes') {
      newMinutes = Math.max(0, Math.min(59, parseInt(val as string) || 0));
    } else if (type === 'period') {
      const toPM = val as boolean;
      const currentH12 = selectedTime.hours % 12;
      newHours = toPM ? currentH12 + 12 : currentH12;
    }

    const newTime = { hours: newHours, minutes: newMinutes };
    setSelectedTime(newTime);
    
    if (value) {
      const currentDate = new Date(value);
      onChange(formatISO(currentDate, newTime.hours, newTime.minutes));
    }
  };

  const isSelected = (date: Date) => {
    if (!value) return false;
    const current = new Date(value);
    return date.getDate() === current.getDate() && 
           date.getMonth() === current.getMonth() && 
           date.getFullYear() === current.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isDisabled = (date: Date) => {
    if (!min) return false;
    const minDate = new Date(min);
    return date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  };

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[13px] font-bold text-text-main px-1 font-battambang">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div 
        onClick={() => setIsOpen(true)}
        className="relative group cursor-pointer"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/40 transition-colors group-hover:text-primary pointer-events-none">
          <IconCalendar className="size-4" strokeWidth={1.8} />
        </div>
        <div className="input-standard input-with-icon flex items-center min-h-[44px]">
          <span className={`text-[13px] font-bold ${value ? 'text-text-main' : 'text-text-dim/40'}`}>
            {value ? formatDisplay(value) : "ថ្ងៃ/ខែ/ឆ្នាំ --:--"}
          </span>
        </div>
      </div>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={`ជ្រើសរើស ${label}`}
      >
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Calendar Section */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-black text-text-main font-battambang">
                {khmerMonths[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 text-text-dim hover:text-primary hover:bg-bg-soft rounded-lg transition-all"
                >
                  <IconChevronLeft className="size-4" />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 text-text-dim hover:text-primary hover:bg-bg-soft rounded-lg transition-all"
                >
                  <IconChevronRight className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'].map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-black text-text-dim/40 uppercase tracking-widest font-battambang">
                  {d}
                </div>
              ))}
              {daysInMonth.map((date, i) => (
                <div key={i} className="aspect-square flex items-center justify-center">
                  {date ? (
                    <button
                      disabled={isDisabled(date)}
                      onClick={() => handleDateSelect(date)}
                      className={`
                        size-9 rounded-xl text-xs font-bold transition-all
                        ${isSelected(date) 
                          ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                          : isDisabled(date)
                            ? 'text-text-dim/20 cursor-not-allowed'
                            : 'text-text-main hover:bg-bg-soft hover:text-primary'
                        }
                        ${isToday(date) && !isSelected(date) ? 'border-2 border-primary/20' : ''}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  ) : <div className="size-9" />}
                </div>
              ))}
            </div>
          </div>

          <div className="w-px bg-border-dim/50 hidden md:block" />

          {/* Time & Confirmation */}
          <div className="w-full md:w-48 space-y-6">
            <div className="space-y-4">
              <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-text-dim/60 font-battambang">
                ម៉ោង និងនាទី (AM/PM)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                   <input 
                    type="number" 
                    value={displayHours.toString().padStart(2, '0')}
                    onChange={(e) => handleTimeChange('hours', e.target.value)}
                    className="w-full bg-bg-soft border border-border-dim rounded-xl p-3 text-center text-lg font-black text-text-main outline-none focus:border-primary transition-all"
                   />
                   <span className="absolute -top-2 left-3 bg-card-bg px-1 text-[8px] font-black text-text-dim uppercase tracking-tighter">ម៉ោង</span>
                </div>
                <span className="text-lg font-black text-text-main">:</span>
                <div className="relative flex-1">
                   <input 
                    type="number" 
                    value={selectedTime.minutes.toString().padStart(2, '0')}
                    onChange={(e) => handleTimeChange('minutes', e.target.value)}
                    className="w-full bg-bg-soft border border-border-dim rounded-xl p-3 text-center text-lg font-black text-text-main outline-none focus:border-primary transition-all"
                   />
                   <span className="absolute -top-2 left-3 bg-card-bg px-1 text-[8px] font-black text-text-dim uppercase tracking-tighter">នាទី</span>
                </div>
              </div>

              {/* AM/PM Toggle */}
              <div className="flex p-1 bg-bg-soft rounded-xl border border-border-dim">
                <button
                  onClick={() => handleTimeChange('period', false)}
                  className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${!isPM ? 'bg-primary text-white shadow-sm' : 'text-text-dim hover:text-text-main'}`}
                >
                  ព្រឹក (AM)
                </button>
                <button
                  onClick={() => handleTimeChange('period', true)}
                  className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${isPM ? 'bg-primary text-white shadow-sm' : 'text-text-dim hover:text-text-main'}`}
                >
                  ល្ងាច (PM)
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="w-full btn-primary font-battambang"
            >
              យល់ព្រម
            </button>
            <p className="text-[10px] text-center text-text-dim/60 font-medium">
              កំណត់ថ្ងៃខែឆ្នាំ {required ? 'ជាកំហិត' : 'តាមតម្រូវការ'}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
