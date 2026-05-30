import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Users, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCollection, addItem, updateItem, deleteItem } from "@/lib/use-collection";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/recruitment")({
  component: RecruitmentPage,
});

interface Job { title: string; dept: string; applicants: number; status: string }

const emptyJob: Job = { title: "", dept: "", applicants: 0, status: "مفتوحة" };

function RecruitmentPage() {
  const { data: jobs, loading } = useCollection<Job>("jobs");
  const { data: depts } = useCollection<{ name: string }>("departments");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; data: Job }>({ data: emptyJob });

  const save = async () => {
    if (!editing.data.title) return toast.error("اسم الوظيفة مطلوب");
    if (editing.id) await updateItem("jobs", editing.id, editing.data);
    else await addItem("jobs", editing.data);
    toast.success("تم الحفظ");
    setOpen(false);
    setEditing({ data: emptyJob });
  };

  return (
    <div>
      <PageHeader
        title="التوظيف"
        subtitle="إدارة الوظائف، المتقدمين والمقابلات"
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing({ data: emptyJob }); }}>
            <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />وظيفة جديدة</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing.id ? "تعديل وظيفة" : "وظيفة جديدة"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2"><Label>المسمى الوظيفي</Label><Input value={editing.data.title} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, title: e.target.value } }))} /></div>
                <div className="space-y-1.5">
                  <Label>القسم</Label>
                  <Select value={editing.data.dept} onValueChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, dept: v } }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>{depts.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>الحالة</Label>
                  <Select value={editing.data.status} onValueChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, status: v } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["مفتوحة", "مقابلات", "مغلقة"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2"><Label>عدد المتقدمين</Label><Input type="number" dir="ltr" className="text-right" value={editing.data.applicants} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, applicants: Number(e.target.value) } }))} /></div>
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
      {!loading && jobs.length === 0 && <Card className="p-8 text-center text-muted-foreground">لا توجد وظائف بعد.</Card>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {jobs.map((j) => (
          <Card key={j.id} className="p-5 transition-all hover:shadow-[var(--shadow-elevated)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Briefcase className="h-5 w-5" /></div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditing({ id: j.id, data: j as Job }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={async () => { await deleteItem("jobs", j.id); toast.success("تم الحذف"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            <h3 className="text-base font-semibold">{j.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{j.dept || "—"}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /><span>{j.applicants} متقدم</span></div>
              <Badge variant="outline" className="bg-accent/10 text-accent">{j.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
