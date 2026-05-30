import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCollection, addItem, updateItem, deleteItem } from "@/lib/use-collection";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/departments")({
  component: DepartmentsPage,
});

interface Dept { name: string; manager: string }

function DepartmentsPage() {
  const { data: depts, loading } = useCollection<Dept>("departments");
  const { data: employees } = useCollection<{ dept: string }>("employees");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; data: Dept }>({ data: { name: "", manager: "" } });
  const [delId, setDelId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    employees.forEach((e) => { if (e.dept) m[e.dept] = (m[e.dept] || 0) + 1; });
    return m;
  }, [employees]);

  const save = async () => {
    if (!editing.data.name) return toast.error("اسم القسم مطلوب");
    try {
      if (editing.id) await updateItem("departments", editing.id, editing.data);
      else await addItem("departments", editing.data);
      toast.success("تم الحفظ");
      setOpen(false);
      setEditing({ data: { name: "", manager: "" } });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <PageHeader
        title="الأقسام"
        subtitle="الهيكل التنظيمي وأقسام الشركة"
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing({ data: { name: "", manager: "" } }); }}>
            <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />قسم جديد</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing.id ? "تعديل قسم" : "قسم جديد"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>اسم القسم</Label><Input value={editing.data.name} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, name: e.target.value } }))} /></div>
                <div className="space-y-1.5"><Label>المدير</Label><Input value={editing.data.manager} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, manager: e.target.value } }))} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={save}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      {loading && <p className="text-muted-foreground">جاري التحميل...</p>}
      {!loading && depts.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">لا توجد أقسام بعد. أضف قسمك الأول.</Card>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {depts.map((d) => (
          <Card key={d.id} className="p-5 transition-all hover:shadow-[var(--shadow-elevated)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditing({ id: d.id, data: d as Dept }); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDelId(d.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <h3 className="text-base font-semibold">{d.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">المدير: {d.manager || "—"}</p>
            <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">عدد الموظفين</span>
              <span className="text-2xl font-bold">{counts[d.name] || 0}</span>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف القسم؟</AlertDialogTitle>
            <AlertDialogDescription>لن يتم حذف الموظفين المرتبطين به.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (delId) { await deleteItem("departments", delId); toast.success("تم الحذف"); setDelId(null); } }}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
