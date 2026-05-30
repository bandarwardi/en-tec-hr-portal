import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Download, MoreHorizontal } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/employees")({
  component: EmployeesPage,
});

const employees = [
  { id: "EMP-001", name: "أحمد علي السالم", dept: "تقنية المعلومات", role: "مهندس برمجيات", status: "نشط", email: "ahmed@entec.com", phone: "0551234567" },
  { id: "EMP-002", name: "سارة محمود", dept: "الموارد البشرية", role: "أخصائي توظيف", status: "نشط", email: "sara@entec.com", phone: "0554567890" },
  { id: "EMP-003", name: "خالد العتيبي", dept: "المبيعات", role: "مدير مبيعات", status: "نشط", email: "khaled@entec.com", phone: "0557890123" },
  { id: "EMP-004", name: "نورة الحربي", dept: "المالية", role: "محاسب أول", status: "إجازة", email: "noura@entec.com", phone: "0552345678" },
  { id: "EMP-005", name: "فهد القحطاني", dept: "التسويق", role: "مصمم جرافيك", status: "نشط", email: "fahad@entec.com", phone: "0556789012" },
  { id: "EMP-006", name: "ليلى الزهراني", dept: "تقنية المعلومات", role: "محلل نظم", status: "نشط", email: "laila@entec.com", phone: "0553456789" },
  { id: "EMP-007", name: "محمد الشمري", dept: "المبيعات", role: "مندوب مبيعات", status: "موقوف", email: "mohammed@entec.com", phone: "0558901234" },
];

function statusTone(s: string) {
  if (s === "نشط") return "bg-success/15 text-success";
  if (s === "إجازة") return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

function EmployeesPage() {
  return (
    <div>
      <PageHeader
        title="الموظفون"
        subtitle="إدارة بيانات الموظفين والمناصب الوظيفية"
        actions={
          <>
            <Button variant="outline"><Download className="ml-2 h-4 w-4" />تصدير</Button>
            <Button><Plus className="ml-2 h-4 w-4" />إضافة موظف</Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ابحث بالاسم أو رقم الموظف..." className="pr-9" />
          </div>
          <Button variant="outline" size="sm"><Filter className="ml-2 h-4 w-4" />تصفية</Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الموظف</TableHead>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">القسم</TableHead>
                <TableHead className="text-right">المنصب</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.id}</TableCell>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.dept}</TableCell>
                  <TableCell>{e.role}</TableCell>
                  <TableCell dir="ltr" className="text-right text-muted-foreground">{e.email}</TableCell>
                  <TableCell dir="ltr" className="text-right text-muted-foreground">{e.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusTone(e.status)}>{e.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
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
