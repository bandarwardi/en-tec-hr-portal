import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, UserX, LogIn, LogOut, QrCode, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/attendance")({
  component: AttendancePage,
});

const records = [
  { name: "أحمد علي السالم", in: "08:02", out: "17:05", status: "حاضر", hours: "9س 03د" },
  { name: "سارة محمود", in: "08:15", out: "17:10", status: "متأخر", hours: "8س 55د" },
  { name: "خالد العتيبي", in: "—", out: "—", status: "غائب", hours: "—" },
  { name: "نورة الحربي", in: "07:55", out: "16:30", status: "حاضر", hours: "8س 35د" },
  { name: "فهد القحطاني", in: "08:01", out: "—", status: "في العمل", hours: "—" },
];

function tone(s: string) {
  if (s === "حاضر" || s === "في العمل") return "bg-success/15 text-success";
  if (s === "متأخر") return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

function AttendancePage() {
  return (
    <div>
      <PageHeader
        title="الحضور والانصراف"
        subtitle="إدارة الحضور، الشفتات، GPS وQR Attendance"
        actions={
          <>
            <Button variant="outline"><QrCode className="ml-2 h-4 w-4" />QR</Button>
            <Button variant="outline"><MapPin className="ml-2 h-4 w-4" />موقع GPS</Button>
            <Button><LogIn className="ml-2 h-4 w-4" />تسجيل حضور</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="الحاضرون اليوم" value="118" icon={CalendarCheck} tone="success" />
        <StatCard title="المتأخرون" value="6" icon={Clock} tone="warning" />
        <StatCard title="الغائبون" value="4" icon={UserX} tone="destructive" />
        <StatCard title="ساعات العمل الإضافي" value="42س" icon={LogOut} tone="accent" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="text-base font-semibold">سجل الحضور اليوم</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">وقت الحضور</TableHead>
                <TableHead className="text-right">وقت الانصراف</TableHead>
                <TableHead className="text-right">ساعات العمل</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.in}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.out}</TableCell>
                  <TableCell>{r.hours}</TableCell>
                  <TableCell><Badge variant="outline" className={tone(r.status)}>{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
