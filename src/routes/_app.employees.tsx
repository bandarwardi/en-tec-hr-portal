import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Search, Download, Pencil, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCollection, addItem, updateItem, deleteItem, orderBy } from "@/lib/use-collection";
import { toast } from "sonner";
import { formatEGP } from "@/lib/currency";

export const Route = createFileRoute("/_app/employees")({
  component: EmployeesPage,
});

interface Employee {
  code: string;
  name: string;
  dept: string;
  role: string;
  status: string;
  email: string;
  phone: string;
  baseSalary?: number;
  allowance?: number;
  joinDate?: string;
}

function statusTone(s: string) {
  if (s === "نشط") return "bg-success/15 text-success";
  if (s === "إجازة") return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

const empty: Employee = {
  code: "", name: "", dept: "", role: "", status: "نشط",
  email: "", phone: "", baseSalary: 0, allowance: 0, joinDate: "",
};

function EmployeesPage() {
  const { data: employees, loading } = useCollection<Employee>("employees", [orderBy("createdAt", "desc")]);
  const { data: depts } = useCollection<{ name: string }>("departments");
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; data: Employee }>({ data: empty });
  const [delId, setDelId] = useState<string | null>(null);

  const filtered = useMemo(
    () => employees.filter((e) =>
      !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.code?.toLowerCase().includes(search.toLowerCase()),
    ),
    [employees, search],
  );

  const save = async () => {
    const d = editing.data;
    if (!d.name || !d.code) return toast.error("الاسم ورقم الموظف مطلوبان");
    try {
      if (editing.id) {
        await updateItem("employees", editing.id, d);
        toast.success("تم تحديث الموظف");
      } else {
        await addItem("employees", d);
        toast.success("تمت إضافة الموظف");
      }
      setOpenForm(false);
      setEditing({ data: empty });
    } catch (e: any) {
      toast.error("فشل الحفظ", { description: e.message });
    }
  };

  const exportCsv = () => {
    const rows = [
      ["رقم الموظف", "الاسم", "القسم", "المنصب", "البريد", "الهاتف", "الراتب", "الحالة"],
      ...employees.map((e) => [e.code, e.name, e.dept, e.role, e.email, e.phone, e.baseSalary || 0, e.status]),
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "employees.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="الموظفون"
        subtitle="إدارة بيانات الموظفين والمناصب الوظيفية"
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}><Download className="ml-2 h-4 w-4" />تصدير</Button>
            <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing({ data: empty }); }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing({ data: empty })}><Plus className="ml-2 h-4 w-4" />إضافة موظف</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{editing.id ? "تعديل موظف" : "إضافة موظف"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="رقم الموظف" value={editing.data.code} onChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, code: v } }))} />
                  <Field label="الاسم" value={editing.data.name} onChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, name: v } }))} />
                  <div className="space-y-1.5">
                    <Label>القسم</Label>
                    <Select value={editing.data.dept} onValueChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, dept: v } }))}>
                      <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      <SelectContent>
                        {depts.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="المنصب" value={editing.data.role} onChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, role: v } }))} />
                  <Field label="البريد" value={editing.data.email} onChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, email: v } }))} />
                  <Field label="الهاتف" value={editing.data.phone} onChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, phone: v } }))} />
                  <Field label="الراتب الأساسي" type="number" value={String(editing.data.baseSalary || 0)} onChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, baseSalary: Number(v) } }))} />
                  <Field label="البدلات" type="number" value={String(editing.data.allowance || 0)} onChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, allowance: Number(v) } }))} />
                  <Field label="تاريخ الالتحاق" type="date" value={editing.data.joinDate || ""} onChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, joinDate: v } }))} />
                  <div className="space-y-1.5">
                    <Label>الحالة</Label>
                    <Select value={editing.data.status} onValueChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, status: v } }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="نشط">نشط</SelectItem>
                        <SelectItem value="إجازة">إجازة</SelectItem>
                        <SelectItem value="موقوف">موقوف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenForm(false)}>إلغاء</Button>
                  <Button onClick={save}>حفظ</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ابحث بالاسم أو رقم الموظف..." className="pr-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} موظف</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الموظف</TableHead>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">القسم</TableHead>
                <TableHead className="text-right">المنصب</TableHead>
                <TableHead className="text-right">البريد</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">الراتب</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>}
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.code}</TableCell>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.dept}</TableCell>
                  <TableCell>{e.role}</TableCell>
                  <TableCell dir="ltr" className="text-right text-muted-foreground">{e.email}</TableCell>
                  <TableCell dir="ltr" className="text-right text-muted-foreground">{e.phone}</TableCell>
                  <TableCell>{formatEGP(e.baseSalary || 0)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusTone(e.status)}>{e.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing({ id: e.id, data: e as Employee }); setOpenForm(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDelId(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الموظف؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف بيانات الموظف نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { if (delId) { await deleteItem("employees", delId); toast.success("تم الحذف"); setDelId(null); } }}
            >حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={type === "number" || type === "date" ? "ltr" : undefined} className={type === "number" || type === "date" ? "text-right" : ""} />
    </div>
  );
}
