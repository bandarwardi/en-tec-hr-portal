import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, UserX, LogIn, LogOut } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCollection, addItem, orderBy } from "@/lib/use-collection";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings-hook";
import { getLateMinutes } from "@/lib/payroll-calc";
import { formatEGP } from "@/lib/currency";

export const Route = createFileRoute("/_app/attendance")({
  component: AttendancePage,
});

interface Att {
  id?: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  status: string;
  lateMinutes?: number;
}

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);

function tone(s: string) {
  if (s === "حاضر" || s === "في العمل") return "bg-success/15 text-success";
  if (s === "متأخر") return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

function AttendancePage() {
  const { data: employees } = useCollection<any>("employees");
  const { data: records, loading } = useCollection<Att>("attendance", [orderBy("date", "desc")]);
  const { settings: appSettings } = useSettings();
  const [selectedEmp, setSelectedEmp] = useState<string>("");
  const [filterDate, setFilterDate] = useState(today());

  const todayRecs = useMemo(() => records.filter((r) => r.date === filterDate), [records, filterDate]);

  const stats = useMemo(() => {
    const present = todayRecs.filter((r) => r.status === "حاضر" || r.status === "متأخر" || r.status === "في العمل").length;
    const late = todayRecs.filter((r) => r.status === "متأخر").length;
    const absent = Math.max(0, employees.length - todayRecs.length);
    return { present, late, absent };
  }, [todayRecs, employees]);

  const checkIn = async () => {
    if (!selectedEmp) return toast.error("اختر الموظف أولاً");
    const emp = employees.find((e) => e.id === selectedEmp);
    if (!emp) return;
    const existing = records.find((r) => r.employeeId === selectedEmp && r.date === today());
    if (existing) return toast.error("تم تسجيل الحضور مسبقاً اليوم");
    
    const t = now();
    
    let lateMins = getLateMinutes(appSettings.workStart, appSettings.workEnd, t);
    const beyondGrace = lateMins - (appSettings.lateMinutes || 0);
    const isLate = beyondGrace > 0;
    const finalLate = isLate ? beyondGrace : 0;
    const status = isLate ? "متأخر" : "حاضر";

    await addItem("attendance", {
      employeeId: selectedEmp,
      employeeName: emp.name,
      date: today(),
      checkIn: t,
      status,
      lateMinutes: finalLate,
    });
    toast.success("تم تسجيل الحضور");
  };

  return (
    <div>
      <PageHeader
        title="الحضور والانصراف"
        subtitle="إدارة وتسجيل حضور الموظفين"
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={selectedEmp} onValueChange={setSelectedEmp}>
              <SelectTrigger className="w-48"><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={checkIn}><LogIn className="ml-2 h-4 w-4" />تسجيل حضور</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="الحاضرون اليوم" value={String(stats.present)} icon={CalendarCheck} tone="success" />
        <StatCard title="المتأخرون" value={String(stats.late)} icon={Clock} tone="warning" />
        <StatCard title="الغائبون" value={String(stats.absent)} icon={UserX} tone="destructive" />
        <StatCard title="إجمالي السجلات" value={String(records.length)} icon={LogOut} tone="accent" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-base font-semibold">سجل الحضور</h3>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm" dir="ltr" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">وقت الحضور</TableHead>
                <TableHead className="text-right">مدة التأخير</TableHead>
                <TableHead className="text-right">قيمة الخصم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
              {!loading && todayRecs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">لا توجد سجلات لهذا التاريخ</TableCell></TableRow>}
              {todayRecs.map((r) => {
                // Calculate the actual late minutes from the workStart shift time (raw late) for the deduction slabs
                let rawLate = 0;
                if (r.checkIn) {
                  rawLate = getLateMinutes(appSettings.workStart, appSettings.workEnd, r.checkIn);
                }

                const emp = employees.find((e: any) => e.id === r.employeeId);
                const baseSalary = emp?.baseSalary || 0;
                let dayDeduction = 0;
                if (rawLate >= 15 && rawLate <= 60) {
                  dayDeduction = Math.round((baseSalary / 30) * 0.5);
                } else if (rawLate > 60) {
                  dayDeduction = Math.round((baseSalary / 30) * 1.0);
                }

                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employeeName}</TableCell>
                    <TableCell dir="ltr" className="text-right">{r.date}</TableCell>
                    <TableCell dir="ltr" className="text-right font-medium">{r.checkIn || "—"}</TableCell>
                    <TableCell dir="ltr" className="text-right text-destructive">
                      {rawLate > 0 ? `${rawLate} دقيقة` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-semibold">
                      {dayDeduction > 0 ? formatEGP(dayDeduction) : "—"}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={tone(r.status)}>{r.status}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
