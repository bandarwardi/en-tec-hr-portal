import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Users, CalendarCheck, CalendarOff, Wallet, Briefcase, Clock } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
} from "recharts";
import { useCollection, orderBy } from "@/lib/use-collection";
import { formatEGP } from "@/lib/currency";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#6366F1", "#EF4444", "#8B5CF6", "#14B8A6"];

function DashboardPage() {
  const { data: employees } = useCollection<any>("employees");
  const { data: attendance } = useCollection<any>("attendance");
  const { data: leaves } = useCollection<any>("leaves");
  const { data: payroll } = useCollection<any>("payroll", [orderBy("createdAt", "desc")]);
  const { data: jobs } = useCollection<any>("jobs");

  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = useMemo(() => attendance.filter((a) => a.date === today), [attendance, today]);
  const presentToday = todayAtt.filter((a) => a.status === "حاضر" || a.status === "في العمل").length;
  const lateToday = todayAtt.filter((a) => a.lateFlag || a.status === "متأخر").length;
  const activeLeaves = leaves.filter((l) => l.status === "موافق عليها").length;
  const pendingLeaves = leaves.filter((l) => l.status === "بانتظار الموافقة").length;
  const openJobs = jobs.filter((j) => j.status !== "مغلقة").length;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentSlips = payroll.filter((p) => p.month === currentMonth);
  const monthPayroll = currentSlips.reduce((s, p) => s + (p.net || 0), 0);

  const deptDist = useMemo(() => {
    const m: Record<string, number> = {};
    employees.forEach((e) => { if (e.dept) m[e.dept] = (m[e.dept] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const last7 = useMemo(() => {
    const days: { day: string; حضور: number; غياب: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const recs = attendance.filter((a) => a.date === key);
      days.push({
        day: d.toLocaleDateString("ar-EG", { weekday: "short" }),
        حضور: recs.length,
        غياب: Math.max(0, employees.length - recs.length),
      });
    }
    return days;
  }, [attendance, employees]);

  return (
    <div>
      <PageHeader title="لوحة التحكم" subtitle="نظرة شاملة على أداء الموارد البشرية" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي الموظفين" value={String(employees.length)} icon={Users} tone="primary" />
        <StatCard title="الحضور اليوم" value={String(presentToday)} hint={employees.length ? `${Math.round((presentToday / employees.length) * 100)}% نسبة الحضور` : ""} icon={CalendarCheck} tone="success" />
        <StatCard title="الإجازات النشطة" value={String(activeLeaves)} hint={`${pendingLeaves} بانتظار الموافقة`} icon={CalendarOff} tone="warning" />
        <StatCard title="رواتب الشهر" value={formatEGP(monthPayroll)} hint={currentMonth} icon={Wallet} tone="accent" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="الموظفون المتأخرون اليوم" value={String(lateToday)} icon={Clock} tone="destructive" />
        <StatCard title="الوظائف المفتوحة" value={String(openJobs)} icon={Briefcase} tone="accent" />
        <StatCard title="طلبات الإجازة المعلقة" value={String(pendingLeaves)} icon={CalendarOff} tone="warning" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold">الحضور خلال آخر 7 أيام</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7}>
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
          <h3 className="mb-4 text-base font-semibold">توزيع الأقسام</h3>
          <div className="h-72">
            {deptDist.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptDist} dataKey="value" nameKey="name" outerRadius={80} innerRadius={50}>
                    {deptDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
