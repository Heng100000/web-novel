"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  IconBooks, IconOrders, IconUsers, 
  IconTrendingUp, IconAlertCircle, IconUserCheck,
  IconCart, IconChevronRight, IconFileText,
  IconGlobe, IconEye
} from "./dashboard-icons";
import { DashboardCharts } from "./_components/dashboard-charts";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

interface Order {
  id: number;
  order_date: string;
  total_amount: string;
  status: string;
  user_email: string;
  items: any[];
}

interface AdminStats {
  total_revenue: number;
  today_revenue: number;
  pending_orders: number;
  total_invoices: number;
  invoiced_revenue: number;
  total_customers: number;
  revenue_growth: number;
  invoice_growth: number;
  customer_growth: number;
  unpaid_growth: number;
  invoice_chart: { name: string; value: number; color: string }[];
  sales_chart: { month: string; amount: number }[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  trendUp,
  href
}: {
  label: string;
  value: string;
  icon: any;
  color: "emerald" | "blue" | "orange" | "purple" | "indigo";
  trend?: string;
  trendUp?: boolean;
  href?: string;
}) {
  const colorMap = {
    emerald: { bar: "bg-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-500/10", iconText: "text-emerald-600 dark:text-emerald-400", grad: "from-emerald-50/30 dark:from-emerald-900/10" },
    blue: { bar: "bg-blue-500", iconBg: "bg-blue-50 dark:bg-blue-500/10", iconText: "text-blue-600 dark:text-blue-400", grad: "from-blue-50/30 dark:from-blue-900/10" },
    orange: { bar: "bg-orange-500", iconBg: "bg-orange-50 dark:bg-orange-500/10", iconText: "text-orange-600 dark:text-orange-400", grad: "from-orange-50/30 dark:from-orange-900/10" },
    purple: { bar: "bg-purple-500", iconBg: "bg-purple-50 dark:bg-purple-500/10", iconText: "text-purple-600 dark:text-purple-400", grad: "from-purple-50/30 dark:from-purple-900/10" },
    indigo: { bar: "bg-indigo-500", iconBg: "bg-indigo-50 dark:bg-indigo-500/10", iconText: "text-indigo-600 dark:text-indigo-400", grad: "from-indigo-50/30 dark:from-indigo-900/10" },
  };

  const theme = colorMap[color];
  const CardContent = (
    <>
      {/* Dynamic Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.grad} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Accent Bar */}
      <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full transition-all duration-300 group-hover:top-6 group-hover:bottom-6 ${theme.bar}`} />
      
      <div className="relative flex items-start justify-between pl-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500 transition-colors">{label}</span>
          <h3 className="text-2xl font-black text-text-main tracking-tight group-hover:scale-[1.02] transition-transform origin-left">{value}</h3>
        </div>
        <div className={`flex size-11 items-center justify-center rounded-2xl ${theme.iconBg} ${theme.iconText} shadow-sm ring-1 ring-black/5 group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
          <Icon className="size-5.5" />
        </div>
      </div>

      <div className="relative flex items-center justify-between pl-2 mt-auto pt-2">
        <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${trendUp ? "text-emerald-500" : "text-red-500"}`}>
          <span className="flex size-4 items-center justify-center rounded-full bg-current/10">
            {trendUp ? "↑" : "↓"}
          </span>
          {trend}
          <span className="text-zinc-400 ml-1 font-bold lowercase tracking-normal opacity-80 group-hover:opacity-100 italic font-battambang">ធៀបនឹងសប្តាហ៍មុន</span>
        </div>
        {href && (
           <div className={`p-1.5 rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-card-bg shadow-sm ring-1 ring-black/5 dark:ring-white/5 ${theme.iconText}`}>
              <IconChevronRight className="size-3.5" />
           </div>
        )}
      </div>
    </>
  );

  return href ? (
    <Link href={href} className="relative rounded-3xl border border-grayborde bg-card-bg p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group flex flex-col gap-4 overflow-hidden">
      {CardContent}
    </Link>
  ) : (
    <div className="relative rounded-3xl border border-grayborde bg-card-bg p-6 shadow-sm transition-all hover:shadow-lg group flex flex-col gap-4 overflow-hidden">
      {CardContent}
    </div>
  );
}



export default function DashboardPage() {
  const { user, isAdmin: contextIsAdmin } = useAuth();
  // Centralized check from context, fallback to manual if context is somehow behind
  const isAdmin = contextIsAdmin || user?.role === 1 || user?.role_details?.name?.toLowerCase() === 'admin';
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [bookCount, setBookCount] = useState<number>(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Book Count
      const books = await apiClient<any[]>("/books/");
      setBookCount(Array.isArray(books) ? books.length : 0);

      // 2. Fetch Recent Orders
      const ordersRes = await apiClient<Order[]>("/orders/");
      const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any).results || [];
      setRecentOrders(orders.slice(0, 5)); // Only top 5

      // 3. Fetch Admin Stats and Analytics if applicable
      if (isAdmin) {
        const [statsRes, analyticsRes] = await Promise.all([
          apiClient<AdminStats>("/orders/stats/"),
          apiClient<any>("/analytics/")
        ]);
        
        setStats({
          ...statsRes,
          total_site_visits: analyticsRes.total_site_visits,
          total_book_views: analyticsRes.total_book_views,
          visits_chart: analyticsRes.visits_chart,
          top_books: analyticsRes.top_books
        });
        setAnalytics(analyticsRes);
      }
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Info */}
      <div className="flex flex-col gap-2 px-1">
        <h2 className="text-2xl font-black tracking-tight text-text-main uppercase font-battambang">
          {isAdmin ? "ទិដ្ឋភាពទូទៅរបស់អ្នកគ្រប់គ្រង" : "ទិដ្ឋភាពទូទៅរបស់អ្នក"}
        </h2>
        <p className="text-[13px] font-bold text-zinc-400 font-battambang">
           សូមស្វាគមន៍មកវិញ, <span className="text-primary font-black uppercase">{user.full_name}</span>។ 
           {isAdmin ? " នេះគឺជាទិដ្ឋភាពរួមនៃដំណើរការហាងរបស់អ្នក។" : " នេះគឺជាសកម្មភាពគណនីរបស់អ្នក។"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <StatCard 
          label="ចំណូលសរុប" 
          value={`$${stats?.total_revenue?.toFixed(2) || "0.00"}`} 
          icon={IconTrendingUp} 
          color="emerald" 
          trend={`${Math.abs(stats?.revenue_growth || 0)}%`}
          trendUp={(stats?.revenue_growth || 0) >= 0}
          href="/dashboard/orders"
        />
        <StatCard 
          label="ការចូលមើលវេបសាយ" 
          value={(stats?.total_site_visits || 0).toLocaleString()} 
          icon={IconGlobe} 
          color="blue" 
          trend="Real-time"
          trendUp={true}
        />
        <StatCard 
          label="ការមើលសៀវភៅ" 
          value={(stats?.total_book_views || 0).toLocaleString()} 
          icon={IconEye} 
          color="purple" 
          trend="Total Views"
          trendUp={true}
        />
        <StatCard 
          label="ការបញ្ជាទិញមិនទាន់ទូទាត់" 
          value={(stats?.pending_orders || 0).toString()} 
          icon={IconAlertCircle} 
          color="orange" 
          trend={`${Math.abs(stats?.unpaid_growth || 0)}%`}
          trendUp={(stats?.unpaid_growth || 0) < 0} 
          href="/dashboard/orders"
        />
      </div>

      {/* Analytics & Top Books Section */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Card */}
          <div className="lg:col-span-2 rounded-3xl border border-grayborde bg-card-bg p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                   <h3 className="text-lg font-black tracking-tight text-text-main font-battambang">សកម្មភាពចូលមើលវេបសាយ</h3>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">ស្ថិតិក្នុងរយៈពេល ៧ ថ្ងៃចុងក្រោយ</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/10">
                   <IconTrendingUp className="size-5" />
                </div>
             </div>
             
             <div className="h-[400px] w-full mt-8 relative group/chart">
                {/* Horizontal Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                   {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-full h-px bg-zinc-200 dark:bg-zinc-800" />
                   ))}
                </div>

                <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 400" preserveAspectRatio="none">
                   <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                         <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                   </defs>

                   {/* Path Generation Logic */}
                   {(() => {
                      let data = stats?.visits_chart || [];
                      if (data.length === 0) return null;
                      
                      if (data.length === 1) {
                        data = [{ date: 'Start', visits: 0 }, ...data];
                      }
                      
                      const maxVisits = Math.max(...data.map(v => v.visits), 10);
                      const width = 1000;
                      const height = 400;
                      const padding = 40; // Top/bottom padding
                      const effectiveHeight = height - (padding * 2);
                      
                      const points = data.map((v, i) => ({
                         x: (i / (data.length - 1)) * width,
                         y: padding + (effectiveHeight - (v.visits / maxVisits) * effectiveHeight)
                      }));

                      let pathData = `M ${points[0].x},${points[0].y}`;
                      for (let i = 0; i < points.length - 1; i++) {
                         const curr = points[i];
                         const next = points[i + 1];
                         const cp1x = curr.x + (next.x - curr.x) / 2;
                         const cp2x = curr.x + (next.x - curr.x) / 2;
                         pathData += ` C ${cp1x},${curr.y} ${cp2x},${next.y} ${next.x},${next.y}`;
                      }

                      const areaPath = `${pathData} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`;

                      return (
                         <>
                            <path d={areaPath} fill="url(#chartGradient)" className="animate-in fade-in duration-1000" />
                            <path 
                              d={pathData} 
                              fill="none" 
                              stroke="#3b82f6" 
                              strokeWidth="5" 
                              strokeLinecap="round" 
                              className="drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                              style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: 'draw 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}
                            />
                         </>
                      );
                   })()}
                </svg>

                {/* Interaction Points Overlay */}
                <div className="absolute inset-0 flex justify-between px-0">
                   {stats?.visits_chart?.map((item, idx) => {
                      const dataLength = stats?.visits_chart?.length || 1;
                      const maxVisits = Math.max(...(stats?.visits_chart?.map(v => v.visits) || [10]), 10);
                      const padding = 40;
                      const height = 400;
                      const effectiveHeight = height - (padding * 2);
                      const bottomPx = padding + (effectiveHeight - (item.visits / maxVisits) * effectiveHeight);
                      const bottomPercent = ((height - bottomPx) / height) * 100;
                      
                      return (
                         <div key={idx} className="relative flex-1 flex flex-col items-center group/point">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/point:opacity-100 transition-opacity border-x border-blue-500/10" />
                            
                            <div 
                               className="absolute transition-all duration-700 ease-out z-10"
                               style={{ bottom: `${bottomPercent}%`, transform: 'translateY(50%)' }}
                            >
                               <div className="relative">
                                  <div className="size-5 rounded-full bg-white dark:bg-zinc-900 border-[5px] border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover/point:scale-125 transition-transform duration-300 ring-8 ring-blue-500/10" />
                                  
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 opacity-0 group-hover/point:opacity-100 transition-all duration-400 scale-75 group-hover/point:scale-100 pointer-events-none z-30">
                                     <div className="bg-zinc-900/95 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl border border-white/10 min-w-[120px]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">{item.date}</p>
                                        <div className="flex items-center gap-2.5">
                                           <div className="size-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
                                           <span className="text-lg font-black">{item.visits} <span className="text-[10px] opacity-50 uppercase font-bold">Visits</span></span>
                                        </div>
                                     </div>
                                     <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-zinc-900/95" />
                                  </div>
                               </div>
                            </div>

                            <div className="absolute -bottom-10">
                               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                  {item.date.split('-').slice(1).join('/')}
                               </span>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>

             <style jsx>{`
                @keyframes draw {
                   to { stroke-dashoffset: 0; }
                }
             `}</style>
          </div>

          {/* Top Books List */}
          <div className="rounded-3xl border border-grayborde bg-card-bg p-8 shadow-sm flex flex-col group/list">
             <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                   <h3 className="text-lg font-black tracking-tight text-text-main font-battambang">សៀវភៅពេញនិយមបំផុត</h3>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">ចំណាត់ថ្នាក់តាមចំនួនការចូលមើល</p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-purple-500/10 group-hover/list:scale-110 transition-transform">
                   <IconBooks className="size-5.5" />
                </div>
             </div>

             <div className="flex flex-col gap-5 flex-1">
                {stats?.top_books?.slice(0, 5).map((book, idx) => (
                   <div key={book.id} className="flex items-center gap-4 group p-2 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all">
                      <div className="relative size-14 flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-black/5 shadow-md group-hover:scale-105 transition-transform duration-500">
                         <img src={book.image_url} alt={book.title} className="size-full object-cover" />
                         <div className="absolute top-0 left-0 size-full bg-black/5 group-hover:bg-transparent transition-colors" />
                         <div className="absolute top-1 left-1 size-5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-[10px] font-black text-primary">
                            {idx + 1}
                         </div>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                         <h4 className="text-[13px] font-black text-text-main truncate group-hover:text-primary transition-colors font-battambang tracking-tight">{book.title}</h4>
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{book.category_details?.name || "Uncategorized"}</span>
                            <div className="size-1 rounded-full bg-zinc-300" />
                            <span className="text-[9px] font-bold text-primary opacity-80">${book.price}</span>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <div className="flex items-center gap-1 text-primary">
                            <IconEye className="size-3" />
                            <span className="text-sm font-black tracking-tight">{book.views_count}</span>
                         </div>
                         <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter opacity-60">Views</span>
                      </div>
                   </div>
                ))}
                {(!stats?.top_books || stats.top_books.length === 0) && (
                   <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                      <IconBooks className="size-12" />
                      <p className="text-[10px] font-black uppercase tracking-widest">មិនទាន់មានទិន្នន័យ</p>
                   </div>
                )}
             </div>
             
             <Link href="/dashboard/books" className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all active:scale-[0.98] font-battambang group">
                មើលសៀវភៅទាំងអស់ 
                <div className="bg-white/20 p-1 rounded-lg group-hover:translate-x-1 transition-transform">
                   <IconChevronRight className="size-3" />
                </div>
             </Link>
          </div>
        </div>
      )}

      {/* Charts Section - Forced Visible */}
      <DashboardCharts 
        invoiceData={stats?.invoice_chart} 
        salesData={stats?.sales_chart} 
      />

      {/* Recent Orders Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10">
            <IconCart className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-text-main font-battambang">
              {isAdmin ? "ការគ្រប់គ្រងការបញ្ជាទិញ" : "ប្រវត្តិនៃការបញ្ជាទិញ"}
            </h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 font-battambang">
              {isAdmin ? "ពិនិត្យមើលប្រតិបត្តិការ និងការទូទាត់របស់អតិថិជន" : "តាមដានការទិញ និងស្ថានភាពទូទាត់ប្រាក់របស់អ្នក"}
            </p>
          </div>
        </div>
        <Link href="/dashboard/orders" className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-primary dark:text-emerald-500 transition-all hover:gap-2 font-battambang">
             មើលប្រវត្តិពេញលេញ <IconChevronRight className="size-3" />
        </Link>
      </div>
      <section className="rounded-2xl border border-grayborde bg-card-bg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-600 font-battambang">
               <p className="text-xs font-black uppercase tracking-widest">រកមិនឃើញប្រតិបត្តិការទេ</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-grayborde bg-zinc-50/20 dark:bg-zinc-900/20 text-xs font-black uppercase tracking-widest text-zinc-400 font-battambang">
                  <th className="px-8 py-5">លេខសម្គាល់ / {isAdmin ? "អតិថិជន" : "ពេលវេលា"}</th>
                  <th className="px-8 py-5">ស្ថានភាព</th>
                  <th className="px-8 py-5">ចំនួនទឹកប្រាក់</th>
                  <th className="px-8 py-5 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grayborde">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="text-[13px] transition-all hover:bg-bg-soft/50 cursor-pointer group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/5 dark:bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-primary dark:text-emerald-500">
                           {order.id}
                        </div>
                        <div className="flex flex-col">
                           <span className="font-bold text-text-main text-xs">{isAdmin ? order.user_email : new Date(order.order_date).toLocaleDateString()}</span>
                           <span className="text-[10px] font-medium text-zinc-400">{isAdmin ? new Date(order.order_date).toLocaleDateString() : "Order ID: #" + order.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ring-1 ${
                        order.status.toLowerCase() === "completed" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/10" : 
                        order.status.toLowerCase() === "pending" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/10" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/10"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 font-black text-text-main text-xs">${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td className="px-8 py-4 text-right">
                       <Link href="/dashboard/orders" className="p-2 rounded-lg bg-bg-soft text-text-dim group-hover:bg-primary/10 group-hover:text-primary dark:group-hover:text-emerald-500 transition-all inline-block">
                          <IconChevronRight className="size-4" />
                       </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
