import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileBarChart2, Download, Search } from "lucide-react";
import { useCollection } from "@/lib/use-collection";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function exportCsv(name: string, rows: any[][]) {
  if (rows.length <= 1) { toast.error("لا توجد بيانات للتصدير"); return; }
  const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `${name}.csv`; a.click();
}

function ReportsPage() {
  const { data: employees } = useCollection<any>("employees");
  const { data: attendance } = useCollection<any>("attendance");
  const { data: leaves } = useCollection<any>("leaves");
  const { data: payroll } = useCollection<any>("payroll");
  const { data: depts } = useCollection<{ name: string }>("departments");

  const [filterEmp, setFilterEmp] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      if (filterEmp !== "all" && a.employeeId !== filterEmp) return false;
      if (dateFrom && a.date < dateFrom) return false;
      if (dateTo && a.date > dateTo) return false;
      if (filterDept !== "all") {
        const emp = employees.find((e) => e.id === a.employeeId);
        if (emp?.dept !== filterDept) return false;
      }
      return true;
    });
  }, [attendance, filterEmp, filterDept, dateFrom, dateTo, employees]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      if (filterEmp !== "all" && l.employeeId !== filterEmp) return false;
      if (dateFrom && l.from < dateFrom) return false;
      if (dateTo && l.from > dateTo) return false;
      if (filterDept !== "all") {
        const emp = employees.find((e) => e.id === l.employeeId);
        if (emp?.dept !== filterDept) return false;
      }
      return true;
    });
  }, [leaves, filterEmp, filterDept, dateFrom, dateTo, employees]);

  const filteredPayroll = useMemo(() => {
    return payroll.filter((p) => {
      if (filterEmp !== "all" && p.employeeId !== filterEmp) return false;
      if (filterDept !== "all") {
        const emp = employees.find((e) => e.id === p.employeeId);
        if (emp?.dept !== filterDept) return false;
      }
      return true;
    });
  }, [payroll, filterEmp, filterDept, employees]);

  const attendanceStats = useMemo(() => {
    const present = filteredAttendance.filter(a => a.status === "حضور").length;
    const late = filteredAttendance.filter(a => a.status === "تأخير").length;
    const absent = filteredAttendance.filter(a => a.status === "غياب").length;
    return [
      { name: "حضور", value: present, color: "#22c55e" },
      { name: "تأخير", value: late, color: "#f59e0b" },
      { name: "غياب", value: absent, color: "#ef4444" }
    ];
  }, [filteredAttendance]);

  const leaveStats = useMemo(() => {
    const approved = filteredLeaves.filter(l => l.status === "موافق عليها").length;
    const pending = filteredLeaves.filter(l => l.status === "بانتظار الموافقة").length;
    const rejected = filteredLeaves.filter(l => l.status === "مرفوضة").length;
    return [
      { name: "موافق", value: approved, color: "#22c55e" },
      { name: "بانتظار", value: pending, color: "#f59e0b" },
      { name: "مرفوض", value: rejected, color: "#ef4444" }
    ];
  }, [filteredLeaves]);

  const reports = [
    {
      title: "تقرير الحضور (مفلتر)", desc: `${filteredAttendance.length} سجل`,
      run: () => exportCsv("attendance_filtered", [
        ["الموظف", "التاريخ", "حضور", "انصراف", "الحالة"],
        ...filteredAttendance.map((a) => [a.employeeName, a.date, a.checkIn, a.checkOut, a.status]),
      ]),
    },
    {
      title: "تقرير الإجازات (مفلتر)", desc: `${filteredLeaves.length} طلب`,
      run: () => exportCsv("leaves_filtered", [
        ["الموظف", "النوع", "من", "إلى", "أيام", "الحالة"],
        ...filteredLeaves.map((l) => [l.employeeName, l.type, l.from, l.to, l.days, l.status]),
      ]),
    },
    {
      title: "تقرير الرواتب (مفلتر)", desc: `${filteredPayroll.length} كشف`,
      run: () => exportCsv("payroll_filtered", [
        ["الشهر", "الموظف", "الأساسي", "البدلات", "الخصومات", "الصافي", "الحالة"],
        ...filteredPayroll.map((p) => [p.month, p.employeeName, p.base, p.allow, p.deduct, p.net, p.status]),
      ]),
    },
  ];

  return (
    <div>
      <PageHeader title="التقارير والتحليلات" subtitle="تصدير وتحليل بيانات النظام مع الفلاتر والرسوم البيانية" />
      
      {/* Filters */}
      <Card className="mb-6 p-5">
        <h3 className="mb-4 text-base font-semibold flex items-center gap-2"><Search className="h-4 w-4" /> فلاتر البحث</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>القسم</Label>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {depts.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>الموظف</Label>
            <Select value={filterEmp} onValueChange={setFilterEmp}>
              <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {employees.filter(e => filterDept === "all" || e.dept === filterDept).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>من تاريخ</Label>
            <Input type="date" dir="ltr" className="text-right" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>إلى تاريخ</Label>
            <Input type="date" dir="ltr" className="text-right" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-5 h-80">
          <h3 className="text-base font-semibold mb-4 text-center">إحصائيات الحضور</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={attendanceStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {attendanceStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 h-80">
          <h3 className="text-base font-semibold mb-4 text-center">إحصائيات الإجازات</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={leaveStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {leaveStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.title} className="p-5 transition-all hover:shadow-[var(--shadow-elevated)]">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileBarChart2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">{r.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={r.run}><Download className="ml-1 h-3.5 w-3.5" />CSV تصدير</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
