import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarOff, CalendarCheck, CalendarX, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/leaves")({
  component: LeavesPage,
});

const requests = [
  { name: "أحمد علي", type: "سنوية", from: "2026-06-05", to: "2026-06-10", days: 5, status: "بانتظار الموافقة" },
  { name: "نورة الحربي", type: "مرضية", from: "2026-06-01", to: "2026-06-03", days: 3, status: "موافق عليها" },
  { name: "محمد الشمري", type: "طارئة", from: "2026-06-04", to: "2026-06-04", days: 1, status: "مرفوضة" },
  { name: "ليلى الزهراني", type: "أمومة", from: "2026-06-15", to: "2026-09-15", days: 90, status: "موافق عليها" },
  { name: "فهد القحطاني", type: "بدون راتب", from: "2026-07-01", to: "2026-07-07", days: 7, status: "بانتظار الموافقة" },
];

function tone(s: string) {
  if (s === "موافق عليها") return "bg-success/15 text-success";
  if (s === "بانتظار الموافقة") return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

function LeavesPage() {
  return (
    <div>
      <PageHeader
        title="الإجازات"
        subtitle="طلبات الإجازات، الرصيد، والموافقات"
        actions={<Button><Plus className="ml-2 h-4 w-4" />طلب إجازة</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجازات نشطة" value="9" icon={CalendarOff} tone="accent" />
        <StatCard title="موافق عليها (الشهر)" value="23" icon={CalendarCheck} tone="success" />
        <StatCard title="بانتظار المراجعة" value="6" icon={CalendarOff} tone="warning" />
        <StatCard title="مرفوضة" value="2" icon={CalendarX} tone="destructive" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="text-base font-semibold">طلبات الإجازات</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">من</TableHead>
                <TableHead className="text-right">إلى</TableHead>
                <TableHead className="text-right">الأيام</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.name + r.from}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.from}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.to}</TableCell>
                  <TableCell>{r.days}</TableCell>
                  <TableCell><Badge variant="outline" className={tone(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell>
                    {r.status === "بانتظار الموافقة" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-success">اعتماد</Button>
                        <Button size="sm" variant="outline" className="text-destructive">رفض</Button>
                      </div>
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
