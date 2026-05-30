import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export const Route = createFileRoute("/_app/departments")({
  component: DepartmentsPage,
});

const depts = [
  { name: "تقنية المعلومات", manager: "م. عبدالله النور", count: 42, color: "bg-accent/10 text-accent" },
  { name: "المبيعات", manager: "أ. خالد العتيبي", count: 28, color: "bg-success/10 text-success" },
  { name: "الموارد البشرية", manager: "أ. سارة محمود", count: 14, color: "bg-warning/15 text-warning" },
  { name: "المالية", manager: "أ. نورة الحربي", count: 18, color: "bg-primary/10 text-primary" },
  { name: "التسويق", manager: "أ. فهد القحطاني", count: 22, color: "bg-destructive/10 text-destructive" },
  { name: "العمليات", manager: "م. ماجد الدوسري", count: 16, color: "bg-accent/10 text-accent" },
];

function DepartmentsPage() {
  return (
    <div>
      <PageHeader
        title="الأقسام"
        subtitle="الهيكل التنظيمي وأقسام الشركة"
        actions={<Button><Plus className="ml-2 h-4 w-4" />قسم جديد</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {depts.map((d) => (
          <Card key={d.name} className="p-5 transition-all hover:shadow-[var(--shadow-elevated)]">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${d.color}`}>
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">{d.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">المدير: {d.manager}</p>
            <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">عدد الموظفين</span>
              <span className="text-2xl font-bold">{d.count}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
