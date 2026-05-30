import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart2, Download } from "lucide-react";
import { useCollection } from "@/lib/use-collection";
import { toast } from "sonner";

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
  const { data: jobs } = useCollection<any>("jobs");

  const reports = [
    {
      title: "تقرير الموظفين", desc: `${employees.length} موظف`,
      run: () => exportCsv("employees", [
        ["الكود", "الاسم", "القسم", "المنصب", "الراتب", "الحالة"],
        ...employees.map((e) => [e.code, e.name, e.dept, e.role, e.baseSalary, e.status]),
      ]),
    },
    {
      title: "تقرير الحضور", desc: `${attendance.length} سجل`,
      run: () => exportCsv("attendance", [
        ["الموظف", "التاريخ", "حضور", "انصراف", "الحالة"],
        ...attendance.map((a) => [a.employeeName, a.date, a.checkIn, a.checkOut, a.status]),
      ]),
    },
    {
      title: "تقرير الإجازات", desc: `${leaves.length} طلب`,
      run: () => exportCsv("leaves", [
        ["الموظف", "النوع", "من", "إلى", "أيام", "الحالة"],
        ...leaves.map((l) => [l.employeeName, l.type, l.from, l.to, l.days, l.status]),
      ]),
    },
    {
      title: "تقرير الرواتب", desc: `${payroll.length} كشف`,
      run: () => exportCsv("payroll", [
        ["الشهر", "الموظف", "الأساسي", "البدلات", "الخصومات", "الصافي", "الحالة"],
        ...payroll.map((p) => [p.month, p.employeeName, p.base, p.allow, p.deduct, p.net, p.status]),
      ]),
    },
    {
      title: "تقرير التوظيف", desc: `${jobs.length} وظيفة`,
      run: () => exportCsv("jobs", [
        ["الوظيفة", "القسم", "المتقدمين", "الحالة"],
        ...jobs.map((j) => [j.title, j.dept, j.applicants, j.status]),
      ]),
    },
  ];

  return (
    <div>
      <PageHeader title="التقارير والتحليلات" subtitle="تصدير وتحليل بيانات النظام" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.title} className="p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileBarChart2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">{r.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={r.run}><Download className="ml-1 h-3.5 w-3.5" />CSV / Excel</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
