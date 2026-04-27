"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  IconBooks, IconOrders, IconUsers, 
  IconTrendingUp, IconAlertCircle, IconUserCheck,
  IconCart, IconChevronRight, IconFileText
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

      // 3. Fetch Admin Stats if applicable
      if (isAdmin) {
        const statsRes = await apiClient<AdminStats>("/orders/stats/");
        setStats(statsRes);
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
          label="ចំនួនវិក្កយបត្រ" 
          value={(stats?.total_invoices || 0).toLocaleString()} 
          icon={IconFileText} 
          color="indigo" 
          trend={`${Math.abs(stats?.invoice_growth || 0)}%`}
          trendUp={(stats?.invoice_growth || 0) >= 0}
          href="/dashboard/orders"
        />
        <StatCard 
          label="ចំនួនអតិថិជន" 
          value={(stats?.total_customers || 0).toLocaleString()} 
          icon={IconUsers} 
          color="blue" 
          trend={`${Math.abs(stats?.customer_growth || 0)}%`}
          trendUp={(stats?.customer_growth || 0) >= 0}
          href="/dashboard/users"
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
