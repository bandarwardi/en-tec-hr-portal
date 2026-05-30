import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Pencil, Trash2, Shield, UserCog, Mail } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCollection, addItem, updateItem, deleteItem } from "@/lib/use-collection";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

interface AppUser { id?: string; name: string; email: string; role: string; status: string; }

const emptyUser: AppUser = { name: "", email: "", role: "موظف", status: "نشط" };

function UsersPage() {
  const { data: usersList, loading } = useCollection<AppUser>("app_users");
  const { user: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; data: AppUser }>({ data: emptyUser });

  const save = async () => {
    if (!editing.data.name || !editing.data.email) return toast.error("الاسم والبريد الإلكتروني مطلوبان");
    
    // Note: This only creates a record in Firestore. 
    // Actual Firebase Auth creation requires Admin SDK or Cloud Functions.
    if (editing.id) {
      await updateItem("app_users", editing.id, editing.data);
    } else {
      await addItem("app_users", editing.data);
      toast.info("تم إضافة المستخدم لقاعدة البيانات. (ملاحظة: لإنشاء حساب تسجيل الدخول، يجب استخدام واجهة Firebase أو Cloud Functions)");
    }
    toast.success("تم الحفظ");
    setOpen(false);
    setEditing({ data: emptyUser });
  };

  return (
    <div>
      <PageHeader
        title="إدارة المستخدمين"
        subtitle="إدارة الصلاحيات وحسابات الدخول للنظام"
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing({ data: emptyUser }); }}>
            <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />مستخدم جديد</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing.id ? "تعديل مستخدم" : "مستخدم جديد"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>الاسم الكامل</Label>
                  <Input value={editing.data.name} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, name: e.target.value } }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" dir="ltr" className="text-right" value={editing.data.email} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, email: e.target.value } }))} />
                </div>
                <div className="space-y-2">
                  <Label>الصلاحية (الدور)</Label>
                  <Select value={editing.data.role} onValueChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, role: v } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="مدير النظام">مدير النظام</SelectItem>
                      <SelectItem value="موظف HR">موظف HR</SelectItem>
                      <SelectItem value="مدير قسم">مدير قسم</SelectItem>
                      <SelectItem value="موظف">موظف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select value={editing.data.status} onValueChange={(v) => setEditing((s) => ({ ...s, data: { ...s.data, status: v } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="نشط">نشط</SelectItem>
                      <SelectItem value="موقوف">موقوف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!editing.id && (
                  <div className="sm:col-span-2 bg-accent/10 text-accent p-3 rounded-md text-xs mt-2 border border-accent/20">
                    <span className="font-bold">ملاحظة:</span> إنشاء المستخدم هنا يضيفه فقط لقاعدة البيانات كصلاحيات. 
                    في بيئة الإنتاج الفعلية، سيقوم النظام تلقائياً بإنشاء حساب Firebase Auth موازي وإرسال كلمة المرور.
                  </div>
                )}
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={save}>حفظ البيانات</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      
      {loading && <p className="text-muted-foreground">جاري التحميل...</p>}
      {!loading && usersList.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <UserCog className="mx-auto h-12 w-12 opacity-20 mb-3" />
          <p>لا يوجد مستخدمين مضافين. قم بإضافة أول مستخدم.</p>
        </Card>
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {usersList.map((u) => (
          <Card key={u.id} className="p-5 transition-all hover:shadow-[var(--shadow-elevated)] flex flex-col relative overflow-hidden">
            {currentUser?.email === u.email && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                أنت
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4 mt-2">
              <div className="flex gap-3 items-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {u.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-base">{u.name}</h3>
                  <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                    <Mail className="h-3 w-3 ml-1" />
                    <span dir="ltr">{u.email}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className={u.role === "مدير النظام" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary"}>
                <Shield className="h-3 w-3 ml-1" />
                {u.role}
              </Badge>
              <Badge variant="outline" className={u.status === "نشط" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                {u.status}
              </Badge>
            </div>
            
            <div className="mt-auto pt-4 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing({ id: u.id, data: u as AppUser }); setOpen(true); }}>
                <Pencil className="h-4 w-4 ml-1" /> تعديل
              </Button>
              {currentUser?.email !== u.email && (
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={async () => { await deleteItem("app_users", u.id!); toast.success("تم الحذف"); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
