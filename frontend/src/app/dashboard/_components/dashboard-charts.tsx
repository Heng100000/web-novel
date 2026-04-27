"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface InvoiceData {
  name: string;
  value: number;
  color: string;
}

interface SalesData {
  month: string;
  amount: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e1e1e] px-4 py-2 rounded-xl shadow-2xl border border-white/10">
        <div className="flex items-center gap-2">
           <div className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
           <span className="text-white text-xs font-black">${payload[0].value.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({ 
  invoiceData = [], 
  salesData = [] 
}: { 
  invoiceData?: InvoiceData[], 
  salesData?: SalesData[] 
}) {
  const totalInvoices = invoiceData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Invoice Statistics (Doughnut) */}
      <div className="relative rounded-3xl border border-grayborde bg-card-bg p-8 shadow-sm flex flex-col hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-text-dim/60 uppercase tracking-widest font-battambang">ស្ថិតិវិក្កយបត្រ</h3>
          <div className="flex gap-1">
             <div className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
             <div className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
             <div className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </div>
        </div>

        <div className="flex flex-1 flex-col sm:flex-row items-center gap-10 px-2">
          <div className="relative w-full sm:w-[50%] h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={invoiceData.length > 0 ? invoiceData : [{ name: "Empty", value: 1, color: "#f1f5f9" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {invoiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-battambang">
               <span className="text-3xl font-black text-text-main tracking-tighter">{totalInvoices.toLocaleString()}</span>
               <span className="text-[10px] font-bold text-text-dim/60 uppercase tracking-widest mt-1">វិក្កយបត្រ</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 w-full">
             {invoiceData.map((item, i) => (
               <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                     <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                     <span className="text-[11px] font-black text-text-dim group-hover:text-text-main transition-colors whitespace-nowrap font-battambang">
                        {item.name === 'Paid' ? 'បង់រួច' : item.name === 'Unpaid' ? 'មិនទាន់បង់' : item.name}
                     </span>
                  </div>
                  <span className="text-lg font-black text-text-main group-hover:scale-110 transition-transform">{item.value.toLocaleString()}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Sales Analytics (Line/Area) */}
      <div className="relative lg:col-span-2 rounded-3xl border border-grayborde bg-card-bg p-8 shadow-sm hover:shadow-lg transition-all">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-text-dim/60 uppercase tracking-widest font-battambang">ការវិភាគការលក់</h3>
          <div className="flex gap-1">
             <div className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
             <div className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
             <div className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </div>
        </div>

        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="40%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="currentColor" 
                className="text-border-dim/20" 
              />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900 }}
                className="text-text-dim/60"
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900 }}
                className="text-text-dim/60"
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.4 }} 
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorAmount)"
                animationDuration={2500}
                filter="url(#glow)"
                activeDot={{ 
                  r: 6, 
                  stroke: '#fff', 
                  strokeWidth: 3, 
                  fill: '#3b82f6',
                  className: "shadow-lg shadow-blue-500/50"
                }}
                dot={{ 
                  r: 4, 
                  fill: '#3b82f6', 
                  strokeWidth: 2, 
                  stroke: '#fff',
                  fillOpacity: 1,
                  strokeOpacity: 1
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
