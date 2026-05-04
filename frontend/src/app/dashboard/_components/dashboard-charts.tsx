"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
      <div className="backdrop-blur-xl bg-card-bg/90 px-4 py-3 rounded-2xl shadow-xl border border-grayborde animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-1.5 font-battambang">{label}</p>
        <div className="flex items-center gap-2.5">
           <div className="size-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
           <span className="text-text-main text-base font-black">${payload[0].value.toLocaleString()}</span>
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
  const totalSales = salesData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Left Column: Invoice Distribution (Doughnut) */}
      <div className="lg:col-span-5 relative overflow-hidden rounded-3xl border border-grayborde bg-card-bg p-8 shadow-sm flex flex-col group transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col gap-1 mb-8 relative">
          <h3 className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] font-battambang">ស្ថានភាពវិក្កយបត្រ</h3>
          <p className="text-xl font-black text-text-main tracking-tight">ទិន្នន័យសរុប</p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 relative">
          <div className="relative size-[230px]">
            <div className="absolute inset-0 rounded-full border-[10px] border-bg-soft/50" />
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={invoiceData.length > 0 ? invoiceData : [{ name: "Empty", value: 1, color: "var(--bg-soft)" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={78}
                  outerRadius={100}
                  paddingAngle={5}
                  cornerRadius={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1500}
                >
                  {invoiceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name.includes('Paid') ? 'var(--primary)' : entry.color} 
                      className="outline-none hover:opacity-80 transition-opacity" 
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-4xl font-black text-text-main tracking-tighter">{totalInvoices}</span>
               <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.2em] mt-1 font-battambang">សរុប</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-4">
             {invoiceData.map((item, i) => (
               <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-grayborde/50 bg-bg-soft/20 hover:bg-bg-soft/40 transition-all duration-200">
                  <div className="flex items-center gap-3">
                     <div className="size-2.5 rounded-full" style={{ backgroundColor: item.name.includes('Paid') ? 'var(--primary)' : item.color }} />
                     <span className="text-[13px] font-bold text-text-dim font-battambang">
                        {item.name.includes('Paid') ? 'បង់រួច' : item.name.includes('Unpaid') ? 'មិនទាន់បង់' : item.name}
                     </span>
                  </div>
                  <span className="text-base font-black text-text-main">{item.value.toLocaleString()}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Right Column: Monthly Sales (Area Chart) */}
      <div className="lg:col-span-7 relative overflow-hidden rounded-3xl border border-grayborde bg-card-bg p-8 shadow-sm group transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between mb-10 relative">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] font-battambang">ការវិភាគការលក់</h3>
            <p className="text-xl font-black text-text-main tracking-tight">ចំណូលប្រចាំខែ</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 text-primary border border-primary/10">
             <div className="size-1.5 rounded-full bg-current animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest">USD</span>
          </div>
        </div>

        <div className="h-[320px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="6 6" 
                vertical={false} 
                stroke="var(--grayborde)" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-dim)', fontSize: 10, fontWeight: 800 }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-dim)', fontSize: 10, fontWeight: 800 }}
                tickFormatter={(val) => val >= 1000 ? `$${(val/1000).toFixed(0)}k` : `$${val}`}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }} 
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="var(--primary)" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#areaGradient)"
                animationDuration={2000}
                activeDot={{ 
                  r: 6, 
                  stroke: 'var(--card-bg)', 
                  strokeWidth: 2, 
                  fill: 'var(--primary)',
                  className: "shadow-lg"
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 pt-8 border-t border-grayborde relative">
           <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-text-dim uppercase tracking-widest font-battambang">ចំណូលសរុប</span>
              <span className="text-lg font-black text-primary">${totalSales.toLocaleString()}</span>
           </div>
           <div className="flex flex-col gap-0.5 border-x border-grayborde px-4">
              <span className="text-[9px] font-black text-text-dim uppercase tracking-widest font-battambang">ស្ថានភាព</span>
              <span className="text-lg font-black text-emerald-500">សកម្ម</span>
           </div>
           <div className="flex flex-col gap-0.5 pl-2">
              <span className="text-[9px] font-black text-text-dim uppercase tracking-widest font-battambang">ខែបច្ចុប្បន្ន</span>
              <span className="text-lg font-black text-text-main">{salesData[salesData.length - 1]?.month || '-'}</span>
           </div>
        </div>
      </div>
    </div>
  );
}




