import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart2, Download } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

const reports = [
  { title: "تقرير الحضور الشهري", desc: "تفاصيل الحضور والانصراف لجميع الموظفين" },
  { title: "تقرير الرواتب", desc: "كشف الرواتب الكامل مع البدلات والخصومات" },
  { title: "تقرير الإجازات", desc: "ملخص الإجازات المعتمدة والمرفوضة" },
  { title: "تقرير الأداء", desc: "KPIs ومراجعات الأداء للفترة المحددة" },
  { title: "تقرير التوظيف", desc: "حالة الوظائف المفتوحة والمتقدمين" },
  { title: "تقرير الموظفين", desc: "كافة بيانات الموظفين والأقسام" },
];

function ReportsPage() {
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
              <Button size="sm" variant="outline" className="flex-1"><Download className="ml-1 h-3.5 w-3.5" />PDF</Button>
              <Button size="sm" variant="outline" className="flex-1"><Download className="ml-1 h-3.5 w-3.5" />Excel</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
