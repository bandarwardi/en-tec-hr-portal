import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/recruitment")({
  component: RecruitmentPage,
});

const jobs = [
  { title: "مهندس Frontend", dept: "تقنية المعلومات", applicants: 24, status: "مفتوحة" },
  { title: "مدير مبيعات إقليمي", dept: "المبيعات", applicants: 12, status: "مفتوحة" },
  { title: "محاسب أول", dept: "المالية", applicants: 8, status: "مقابلات" },
  { title: "مصمم UX/UI", dept: "التسويق", applicants: 31, status: "مفتوحة" },
];

function RecruitmentPage() {
  return (
    <div>
      <PageHeader
        title="التوظيف"
        subtitle="إدارة الوظائف، المتقدمين والمقابلات"
        actions={<Button><Plus className="ml-2 h-4 w-4" />وظيفة جديدة</Button>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {jobs.map((j) => (
          <Card key={j.title} className="p-5 transition-all hover:shadow-[var(--shadow-elevated)]">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">{j.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{j.dept}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{j.applicants} متقدم</span>
              </div>
              <Badge variant="outline" className="bg-accent/10 text-accent">{j.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
