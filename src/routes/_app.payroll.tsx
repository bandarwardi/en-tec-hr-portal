import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, Receipt, Download, FileText } from "lucide-react";

export const Route = createFileRoute("/_app/payroll")({
  component: PayrollPage,
});

const slips = [
  { name: "أحمد علي السالم", base: 12000, allow: 2500, deduct: 800, net: 13700, status: "مدفوع" },
  { name: "سارة محمود", base: 9500, allow: 1500, deduct: 400, net: 10600, status: "مدفوع" },
  { name: "خالد العتيبي", base: 15000, allow: 4000, deduct: 1200, net: 17800, status: "بانتظار الدفع" },
  { name: "نورة الحربي", base: 11000, allow: 2000, deduct: 600, net: 12400, status: "مدفوع" },
  { name: "فهد القحطاني", base: 8500, allow: 1200, deduct: 300, net: 9400, status: "بانتظار الدفع" },
];

const fmt = (n: number) => n.toLocaleString("ar-SA") + " ر.س";

function PayrollPage() {
  return (
    <div>
      <PageHeader
        title="الرواتب"
        subtitle="كشوفات الرواتب، البدلات، الخصومات والمكافآت"
        actions={
          <>
            <Button variant="outline"><Download className="ml-2 h-4 w-4" />تصدير كشف</Button>
            <Button><Receipt className="ml-2 h-4 w-4" />إنشاء كشف الشهر</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي الرواتب (نوفمبر)" value="٤٢٨,٥٠٠ ر.س" icon={Wallet} tone="primary" />
        <StatCard title="البدلات" value="٧٢,٠٠٠ ر.س" icon={TrendingUp} tone="success" />
        <StatCard title="الخصومات" value="١٨,٤٠٠ ر.س" icon={Receipt} tone="warning" />
        <StatCard title="صافي الرواتب" value="٤٨٢,١٠٠ ر.س" icon={Wallet} tone="accent" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-base font-semibold">كشف الرواتب — نوفمبر 2026</h3>
          <Badge variant="outline" className="bg-accent/10 text-accent">مسودة</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">الراتب الأساسي</TableHead>
                <TableHead className="text-right">البدلات</TableHead>
                <TableHead className="text-right">الخصومات</TableHead>
                <TableHead className="text-right">الصافي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{fmt(s.base)}</TableCell>
                  <TableCell className="text-success">+{fmt(s.allow)}</TableCell>
                  <TableCell className="text-destructive">-{fmt(s.deduct)}</TableCell>
                  <TableCell className="font-bold">{fmt(s.net)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.status === "مدفوع" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm"><FileText className="ml-1 h-4 w-4" />Payslip</Button>
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
