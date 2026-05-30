import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, UserX, LogIn, LogOut, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCollection, addItem, updateItem, orderBy } from "@/lib/use-collection";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/attendance")({
  component: AttendancePage,
});

interface Att {
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  location?: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);

function tone(s: string) {
  if (s === "حاضر" || s === "في العمل") return "bg-success/15 text-success";
  if (s === "متأخر") return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

function AttendancePage() {
  const { data: employees } = useCollection<{ name: string }>("employees");
  const { data: records, loading } = useCollection<Att>("attendance", [orderBy("date", "desc")]);
  const [selectedEmp, setSelectedEmp] = useState<string>("");
  const [filterDate, setFilterDate] = useState(today());

  const todayRecs = useMemo(() => records.filter((r) => r.date === filterDate), [records, filterDate]);

  const stats = useMemo(() => {
    const present = todayRecs.filter((r) => r.status === "حاضر" || r.status === "في العمل").length;
    const late = todayRecs.filter((r) => r.status === "متأخر").length;
    const absent = Math.max(0, employees.length - todayRecs.length);
    return { present, late, absent };
  }, [todayRecs, employees]);

  const checkIn = async (useGps = false) => {
    if (!selectedEmp) return toast.error("اختر الموظف أولاً");
    const emp = employees.find((e) => e.id === selectedEmp);
    if (!emp) return;
    const existing = records.find((r) => r.employeeId === selectedEmp && r.date === today());
    if (existing) return toast.error("تم تسجيل الحضور مسبقاً اليوم");
    let location = "";
    if (useGps && typeof navigator !== "undefined" && navigator.geolocation) {
      await new Promise<void>((res) => {
        navigator.geolocation.getCurrentPosition(
          (p) => { location = `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`; res(); },
          () => res(),
          { timeout: 5000 },
        );
      });
    }
    const t = now();
    const status = t > "08:15" ? "متأخر" : "حاضر";
    await addItem("attendance", {
      employeeId: selectedEmp,
      employeeName: emp.name,
      date: today(),
      checkIn: t,
      status: "في العمل",
      lateFlag: status === "متأخر",
      location,
    });
    toast.success("تم تسجيل الحضور");
  };

  const checkOut = async (recId: string) => {
    await updateItem("attendance", recId, { checkOut: now(), status: "حاضر" });
    toast.success("تم تسجيل الانصراف");
  };

  return (
    <div>
      <PageHeader
        title="الحضور والانصراف"
        subtitle="إدارة الحضور، تسجيل دخول/خروج، GPS"
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={selectedEmp} onValueChange={setSelectedEmp}>
              <SelectTrigger className="w-48"><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => checkIn(true)}><MapPin className="ml-2 h-4 w-4" />حضور+GPS</Button>
            <Button onClick={() => checkIn(false)}><LogIn className="ml-2 h-4 w-4" />تسجيل حضور</Button>
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
                <TableHead className="text-right">حضور</TableHead>
                <TableHead className="text-right">انصراف</TableHead>
                <TableHead className="text-right">الموقع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
              {!loading && todayRecs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">لا توجد سجلات لهذا التاريخ</TableCell></TableRow>}
              {todayRecs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.employeeName}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.date}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.checkIn || "—"}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.checkOut || "—"}</TableCell>
                  <TableCell dir="ltr" className="text-right text-xs text-muted-foreground">{r.location || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={tone(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell>
                    {!r.checkOut && (
                      <Button size="sm" variant="outline" onClick={() => checkOut(r.id)}>
                        <LogOut className="ml-1 h-3.5 w-3.5" />انصراف
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
