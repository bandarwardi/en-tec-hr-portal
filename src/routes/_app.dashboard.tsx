import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Users, CalendarCheck, CalendarOff, Wallet, Briefcase, Clock, Bell, Megaphone } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const attendanceData = [
  { day: "السبت", حضور: 142, غياب: 8 },
  { day: "الأحد", حضور: 148, غياب: 4 },
  { day: "الإثنين", حضور: 145, غياب: 6 },
  { day: "الثلاثاء", حضور: 150, غياب: 2 },
  { day: "الأربعاء", حضور: 147, غياب: 5 },
  { day: "الخميس", حضور: 138, غياب: 12 },
];

const departments = [
  { name: "تقنية المعلومات", value: 42 },
  { name: "المبيعات", value: 28 },
  { name: "الموارد البشرية", value: 14 },
  { name: "المالية", value: 18 },
  { name: "التسويق", value: 22 },
];

const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#6366F1", "#EF4444"];

const activities = [
  { time: "منذ 5 دقائق", title: "تسجيل دخول الموظف أحمد علي", tone: "accent" },
  { time: "منذ 20 دقيقة", title: "طلب إجازة جديد من سارة محمود", tone: "warning" },
  { time: "منذ ساعة", title: "اعتماد كشف رواتب نوفمبر", tone: "success" },
  { time: "منذ ساعتين", title: "إضافة موظف جديد: خالد العتيبي", tone: "primary" },
];

function DashboardPage() {
  return (
    <div>
      <PageHeader title="لوحة التحكم" subtitle="نظرة شاملة على أداء الموارد البشرية" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي الموظفين" value="124" hint="+4 هذا الشهر" icon={Users} tone="primary" />
        <StatCard title="الحضور اليوم" value="118" hint="95% نسبة الحضور" icon={CalendarCheck} tone="success" />
        <StatCard title="الإجازات النشطة" value="9" hint="3 بانتظار الموافقة" icon={CalendarOff} tone="warning" />
        <StatCard title="الرواتب الحالية" value="٤٢٨,٥٠٠ ر.س" hint="شهر نوفمبر" icon={Wallet} tone="accent" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="الموظفون المتأخرون" value="6" icon={Clock} tone="destructive" />
        <StatCard title="الوظائف المفتوحة" value="12" icon={Briefcase} tone="accent" />
        <StatCard title="تنبيهات جديدة" value="5" icon={Bell} tone="warning" />
        <StatCard title="إعلانات داخلية" value="3" icon={Megaphone} tone="primary" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">معدل الحضور الأسبوعي</h3>
            <span className="text-xs text-muted-foreground">آخر 6 أيام</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" reversed stroke="#64748b" fontSize={12} />
                <YAxis orientation="right" stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="حضور" stroke="#0EA5E9" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">توزيع الأقسام</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departments} dataKey="value" nameKey="name" outerRadius={80} innerRadius={50}>
                  {departments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold">الحضور مقابل الغياب</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" reversed stroke="#64748b" fontSize={12} />
                <YAxis orientation="right" stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Legend />
                <Bar dataKey="حضور" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="غياب" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">آخر الأنشطة</h3>
          <ul className="space-y-4">
            {activities.map((a, i) => (
              <li key={i} className="flex gap-3">
                <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0">
                  <p className="text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
