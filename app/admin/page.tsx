"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  CalendarDays, 
  DollarSign, 
  Users, 
  Loader2,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { getAdminDashboardStats } from "@/actions/admin.actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      const res = await getAdminDashboardStats();
      if (res.success) {
        setStats(res.stats);
      } else {
        setError(res.error || "Failed to load admin stats");
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500 gap-2">
        <AlertCircle className="h-6 w-6" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  const statCards = [
    { title: "Total Revenue (This Month)", value: `$${stats.revenueThisMonth.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Total Bookings", value: stats.totalBookings, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Active Venues", value: stats.totalVenues, icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Registered Users", value: stats.totalUsers, icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Key metrics and analytics for your platform.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-100">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Revenue (Last 6 Months)
            </CardTitle>
            <CardDescription>Monthly revenue from paid bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest bookings created.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentBookings.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent bookings.</p>
            ) : (
              stats.recentBookings.map((b: any) => (
                <div key={b._id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-slate-900 dark:text-slate-100">
                      {b.venue?.name || "Unknown Venue"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {b.user?.name || "Guest"} • {format(new Date(b.eventDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    ${b.totalAmount}
                  </Badge>
                </div>
              ))
            )}
            {stats.pendingBookings > 0 && (
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-2 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{stats.pendingBookings} pending bookings</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
