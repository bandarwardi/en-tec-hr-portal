import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowRight, Save, Upload, Eye, Download, Trash2, FileText, Plus,
  Star, CalendarOff, CalendarCheck, User, IdCard, Briefcase, Wallet, Clock, Phone,
} from "lucide-react";
import {
  useCollection, getDocOnce, setDocItem, addItem, deleteItem, orderBy,
} from "@/lib/use-collection";
import { uploadFile } from "@/lib/upload";
import { toast } from "sonner";
import { formatEGP } from "@/lib/currency";
import { PayslipModal, SlipData } from "@/components/payroll/PayslipModal";

export const Route = createFileRoute("/_app/employees/$id")({
  component: EmployeeProfilePage,
});

const DOC_TYPES = [
  "الرقم القومي",
  "جواز السفر",
  "عقد العمل",
  "الشهادات",
  "السيرة الذاتية",
  "إيصال راتب",
  "أخرى",
] as const;

interface EmployeeFull {
  code?: string;
  name?: string;
  email?: string;
  phone?: string;
  dept?: string;
  role?: string;
  status?: string;
  baseSalary?: number;
  allowance?: number;
  joinDate?: string;
  birthDate?: string;
  nationalId?: string;
  gender?: string;
  maritalStatus?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  manager?: string;
  employmentType?: string; // دوام كامل / جزئي / عقد
  bankAccount?: string;
  notes?: string;
}

function EmployeeProfilePage() {
  const { id } = useParams({ from: "/_app/employees/$id" });
  const [emp, setEmp] = useState<EmployeeFull | null>(null);
  const [loadingEmp, setLoadingEmp] = useState(true);
  const { data: depts } = useCollection<{ name: string }>("departments");
  const { data: allEmployees } = useCollection<{ name: string }>("employees");

  useEffect(() => {
    (async () => {
      const d = await getDocOnce("employees", id);
      setEmp((d as EmployeeFull) || {});
      setLoadingEmp(false);
    })();
  }, [id]);

  if (loadingEmp) return <p className="text-muted-foreground">جاري التحميل...</p>;
  if (!emp) return <Card className="p-8 text-center">الموظف غير موجود.</Card>;

  return (
    <div dir="rtl" className="w-full">
      <PageHeader
        title={emp.name || "موظف"}
        subtitle={`${emp.code || "—"} • ${emp.role || ""} • ${emp.dept || ""}`}
        actions={
          <Link to="/employees">
            <Button variant="outline"><ArrowRight className="ml-2 h-4 w-4" />رجوع للقائمة</Button>
          </Link>
        }
      />

      <Tabs defaultValue="info" dir="rtl">
        <TabsList className="mb-4 h-auto flex-wrap gap-1 bg-muted p-1">
          <TabsTrigger value="info"><User className="ml-1 h-4 w-4" />بيانات الموظف</TabsTrigger>
          <TabsTrigger value="docs"><FileText className="ml-1 h-4 w-4" />المرفقات</TabsTrigger>
          <TabsTrigger value="evals"><Star className="ml-1 h-4 w-4" />التقييمات</TabsTrigger>
          <TabsTrigger value="leaves"><CalendarOff className="ml-1 h-4 w-4" />الإجازات</TabsTrigger>
          <TabsTrigger value="att"><CalendarCheck className="ml-1 h-4 w-4" />الحضور والانصراف</TabsTrigger>
          <TabsTrigger value="payroll"><Wallet className="ml-1 h-4 w-4" />الرواتب</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <InfoTab id={id} emp={emp} setEmp={setEmp} depts={depts} managers={allEmployees as any} />
        </TabsContent>
        <TabsContent value="docs">
          <DocsTab employeeId={id} />
        </TabsContent>
        <TabsContent value="evals">
          <EvalsTab employeeId={id} />
        </TabsContent>
        <TabsContent value="leaves">
          <LeavesTab employeeId={id} employeeName={emp.name || ""} />
        </TabsContent>
        <TabsContent value="att">
          <AttTab employeeId={id} />
        </TabsContent>
        <TabsContent value="payroll">
          <PayrollTab employeeId={id} emp={emp} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== INFO TAB ============== */
function InfoTab({
  id, emp, setEmp, depts, managers,
}: {
  id: string; emp: EmployeeFull; setEmp: (e: EmployeeFull) => void;
  depts: { name: string }[]; managers: { id: string; name: string }[];
}) {
  const [saving, setSaving] = useState(false);
  const set = (k: keyof EmployeeFull, v: any) => setEmp({ ...emp, [k]: v });
  const save = async () => {
    setSaving(true);
    try {
      await setDocItem("employees", id, emp);
      toast.success("تم حفظ بيانات الموظف");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Section icon={User} title="معلومات شخصية">
        <F label="الاسم"><Input value={emp.name || ""} onChange={(e) => set("name", e.target.value)} /></F>
        <F label="الرقم القومي"><Input dir="ltr" className="text-right" value={emp.nationalId || ""} onChange={(e) => set("nationalId", e.target.value)} /></F>
        <F label="تاريخ الميلاد"><Input type="date" dir="ltr" className="text-right" value={emp.birthDate || ""} onChange={(e) => set("birthDate", e.target.value)} /></F>
        <F label="الجنس">
          <Select value={emp.gender || ""} onValueChange={(v) => set("gender", v)}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent><SelectItem value="ذكر">ذكر</SelectItem><SelectItem value="أنثى">أنثى</SelectItem></SelectContent>
          </Select>
        </F>
        <F label="الحالة الاجتماعية">
          <Select value={emp.maritalStatus || ""} onValueChange={(v) => set("maritalStatus", v)}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>
              {["أعزب", "متزوج", "مطلق", "أرمل"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </F>
        <F label="العنوان" full><Input value={emp.address || ""} onChange={(e) => set("address", e.target.value)} /></F>
      </Section>

      <Section icon={Briefcase} title="بيانات التوظيف">
        <F label="رقم الموظف"><Input value={emp.code || ""} onChange={(e) => set("code", e.target.value)} /></F>
        <F label="تاريخ الالتحاق"><Input type="date" dir="ltr" className="text-right" value={emp.joinDate || ""} onChange={(e) => set("joinDate", e.target.value)} /></F>
        <F label="القسم">
          <Select value={emp.dept || ""} onValueChange={(v) => set("dept", v)}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>{depts.map((d, i) => <SelectItem key={i} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </F>
        <F label="المنصب"><Input value={emp.role || ""} onChange={(e) => set("role", e.target.value)} /></F>
        <F label="نوع الدوام">
          <Select value={emp.employmentType || ""} onValueChange={(v) => set("employmentType", v)}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>
              {["دوام كامل", "دوام جزئي", "عقد مؤقت", "متدرب"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </F>
        <F label="حالة الموظف">
          <Select value={emp.status || "نشط"} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["نشط", "إجازة", "موقوف", "منتهية خدمته"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </F>
        <F label="المدير المباشر">
          <Select value={emp.manager || ""} onValueChange={(v) => set("manager", v)}>
            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
            <SelectContent>
              {managers.filter((m) => m.id !== id).map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </F>
      </Section>

      <Section icon={Wallet} title="بيانات الراتب">
        <F label="الراتب الأساسي"><Input type="number" dir="ltr" className="text-right" value={emp.baseSalary || 0} onChange={(e) => set("baseSalary", Number(e.target.value))} /></F>
        <F label="البدلات"><Input type="number" dir="ltr" className="text-right" value={emp.allowance || 0} onChange={(e) => set("allowance", Number(e.target.value))} /></F>
        <F label="رقم الحساب البنكي"><Input dir="ltr" className="text-right" value={emp.bankAccount || ""} onChange={(e) => set("bankAccount", e.target.value)} /></F>
      </Section>

      <Section icon={Phone} title="بيانات التواصل">
        <F label="البريد الإلكتروني"><Input type="email" dir="ltr" className="text-right" value={emp.email || ""} onChange={(e) => set("email", e.target.value)} /></F>
        <F label="رقم الهاتف"><Input dir="ltr" className="text-right" value={emp.phone || ""} onChange={(e) => set("phone", e.target.value)} /></F>
        <F label="جهة اتصال للطوارئ"><Input value={emp.emergencyContact || ""} onChange={(e) => set("emergencyContact", e.target.value)} /></F>
        <F label="هاتف الطوارئ"><Input dir="ltr" className="text-right" value={emp.emergencyPhone || ""} onChange={(e) => set("emergencyPhone", e.target.value)} /></F>
        <F label="ملاحظات" full>
          <Textarea rows={3} value={emp.notes || ""} onChange={(e) => set("notes", e.target.value)} />
        </F>
      </Section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}><Save className="ml-2 h-4 w-4" />{saving ? "...جاري الحفظ" : "حفظ البيانات"}</Button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Icon className="h-4 w-4" /></div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </Card>
  );
}
function F({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-1.5 ${full ? "sm:col-span-2 lg:col-span-3" : ""}`}><Label>{label}</Label>{children}</div>;
}

/* ============== DOCS TAB ============== */
interface Doc { type: string; name: string; url: string; uploadedAt?: any }
function DocsTab({ employeeId }: { employeeId: string }) {
  const { data: docs, loading } = useCollection<Doc>(`employees/${employeeId}/attachments`, [orderBy("createdAt", "desc")]);
  const [type, setType] = useState<string>(DOC_TYPES[0]);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadFile(file);
      await addItem(`employees/${employeeId}/attachments`, { type, name: file.name, url });
      toast.success("تم رفع المرفق");
    } catch (e: any) { toast.error("فشل الرفع", { description: e.message }); }
    finally { setBusy(false); }
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>نوع المستند</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer">
          <Upload className="h-4 w-4" />
          {busy ? "جاري الرفع..." : "رفع ملف"}
          <input type="file" className="hidden" onChange={(e) => upload(e.target.files?.[0] || null)} disabled={busy} />
        </label>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">اسم الملف</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
            {!loading && docs.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">لا توجد مرفقات</TableCell></TableRow>}
            {docs.map((d) => (
              <TableRow key={d.id}>
                <TableCell><Badge variant="outline" className="bg-accent text-accent-foreground">{d.type}</Badge></TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <a href={d.url} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button></a>
                    <a href={d.url} download><Button size="icon" variant="ghost"><Download className="h-4 w-4" /></Button></a>
                    <Button size="icon" variant="ghost" onClick={async () => {
                      await deleteItem(`employees/${employeeId}/attachments`, d.id);
                      toast.success("تم الحذف");
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/* ============== EVAL TAB ============== */
interface Eval { date: string; period: string; score: number; kpi: string; managerNotes: string; employeeFeedback: string; reviewer: string }
const emptyEval: Eval = { date: new Date().toISOString().slice(0, 10), period: "", score: 0, kpi: "", managerNotes: "", employeeFeedback: "", reviewer: "" };
function EvalsTab({ employeeId }: { employeeId: string }) {
  const path = `employees/${employeeId}/evaluations`;
  const { data: evals, loading } = useCollection<Eval>(path, [orderBy("createdAt", "desc")]);
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Eval>(emptyEval);
  const avg = useMemo(() => evals.length ? Math.round(evals.reduce((s, e) => s + (e.score || 0), 0) / evals.length) : 0, [evals]);

  const save = async () => {
    if (!d.period) return toast.error("الفترة مطلوبة");
    await addItem(path, d);
    toast.success("تم حفظ التقييم");
    setD(emptyEval);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-muted-foreground">عدد التقييمات</p><p className="mt-2 text-3xl font-bold">{evals.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">متوسط الأداء</p><p className="mt-2 text-3xl font-bold text-accent-foreground">{avg}%</p></Card>
        <Card className="p-5 flex items-center justify-center">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />تقييم جديد</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>تقييم أداء جديد</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <F label="الفترة"><Input value={d.period} onChange={(e) => setD({ ...d, period: e.target.value })} placeholder="Q1 2026" /></F>
                <F label="تاريخ التقييم"><Input type="date" dir="ltr" className="text-right" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></F>
                <F label="درجة الأداء (0-100)"><Input type="number" dir="ltr" className="text-right" value={d.score} onChange={(e) => setD({ ...d, score: Number(e.target.value) })} /></F>
                <F label="المُقيِّم"><Input value={d.reviewer} onChange={(e) => setD({ ...d, reviewer: e.target.value })} /></F>
                <F label="مؤشرات الأداء (KPI)" full><Textarea rows={2} value={d.kpi} onChange={(e) => setD({ ...d, kpi: e.target.value })} /></F>
                <F label="ملاحظات المدير" full><Textarea rows={2} value={d.managerNotes} onChange={(e) => setD({ ...d, managerNotes: e.target.value })} /></F>
                <F label="ملاحظات الموظف" full><Textarea rows={2} value={d.employeeFeedback} onChange={(e) => setD({ ...d, employeeFeedback: e.target.value })} /></F>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={save}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      <Card className="p-5">
        {loading && <p className="text-muted-foreground">جاري التحميل...</p>}
        {!loading && evals.length === 0 && <p className="py-6 text-center text-muted-foreground">لا توجد تقييمات بعد.</p>}
        <div className="space-y-3">
          {evals.map((e) => (
            <div key={e.id} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-accent text-accent-foreground">{e.period}</Badge>
                  <span className="text-xs text-muted-foreground" dir="ltr">{e.date}</span>
                </div>
                <div className="text-2xl font-bold text-accent-foreground">{e.score}%</div>
              </div>
              {e.kpi && <p className="text-sm"><b>KPI:</b> {e.kpi}</p>}
              {e.managerNotes && <p className="mt-1 text-sm"><b>المدير:</b> {e.managerNotes}</p>}
              {e.employeeFeedback && <p className="mt-1 text-sm text-muted-foreground"><b>الموظف:</b> {e.employeeFeedback}</p>}
              {e.reviewer && <p className="mt-1 text-xs text-muted-foreground">المُقيِّم: {e.reviewer}</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============== LEAVES TAB ============== */
function LeavesTab({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  void employeeName;
  const { data: leaves, loading } = useCollection<any>("leaves", [orderBy("createdAt", "desc")]);
  const mine = leaves.filter((l) => l.employeeId === employeeId);
  const balance = 21 - mine.filter((l) => l.status === "موافق عليها" && l.type === "سنوية" && !l.isPermission)
    .reduce((s, l) => s + (l.days || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-5"><p className="text-sm text-muted-foreground">إجمالي الطلبات</p><p className="mt-2 text-3xl font-bold">{mine.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">موافق عليها</p><p className="mt-2 text-3xl font-bold text-success">{mine.filter((l) => l.status === "موافق عليها").length}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">بانتظار</p><p className="mt-2 text-3xl font-bold text-warning">{mine.filter((l) => l.status === "بانتظار الموافقة").length}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">رصيد سنوي متبقي</p><p className="mt-2 text-3xl font-bold text-accent-foreground">{balance} يوم</p></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-border p-4"><h3 className="text-sm font-semibold">سجل الإجازات والأذونات</h3></div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">من</TableHead>
                <TableHead className="text-right">إلى</TableHead>
                <TableHead className="text-right">المدة</TableHead>
                <TableHead className="text-right">الخصم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
              {!loading && mine.length === 0 && <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">لا توجد سجلات</TableCell></TableRow>}
              {mine.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.isPermission ? `إذن (${l.type})` : l.type}</TableCell>
                  <TableCell dir="ltr" className="text-right">{l.from}{l.startTime ? ` ${l.startTime}` : ""}</TableCell>
                  <TableCell dir="ltr" className="text-right">{l.to}{l.endTime ? ` ${l.endTime}` : ""}</TableCell>
                  <TableCell>{l.isPermission ? "—" : `${l.days} يوم`}</TableCell>
                  <TableCell className="text-destructive">{l.deductionAmount ? formatEGP(l.deductionAmount) : "—"}</TableCell>
                  <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

/* ============== ATTENDANCE TAB ============== */
function AttTab({ employeeId }: { employeeId: string }) {
  const { data: att, loading } = useCollection<any>("attendance", [orderBy("date", "desc")]);
  const mine = att.filter((a) => a.employeeId === employeeId);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const monthRecs = mine.filter((r) => r.date?.startsWith(month));
  const lateCount = monthRecs.filter((r) => r.lateFlag || r.status === "متأخر").length;
  const otCount = monthRecs.filter((r) => r.overtimeMinutes && r.overtimeMinutes > 0).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-5"><p className="text-sm text-muted-foreground">إجمالي السجلات</p><p className="mt-2 text-3xl font-bold">{mine.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">حضور الشهر</p><p className="mt-2 text-3xl font-bold text-success">{monthRecs.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">تأخير الشهر</p><p className="mt-2 text-3xl font-bold text-warning">{lateCount}</p></Card>
        <Card className="p-5"><p className="text-sm text-muted-foreground">أيام إضافية</p><p className="mt-2 text-3xl font-bold text-accent-foreground">{otCount}</p></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-sm font-semibold">سجل الحضور الشهري</h3>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border border-input bg-background px-3 py-1.5 text-sm" dir="ltr" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">حضور</TableHead>
                <TableHead className="text-right">انصراف</TableHead>
                <TableHead className="text-right">الموقع (GPS)</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
              {!loading && monthRecs.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">لا توجد سجلات لهذا الشهر</TableCell></TableRow>}
              {monthRecs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell dir="ltr" className="text-right">{r.date}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.checkIn || "—"}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.checkOut || "—"}</TableCell>
                  <TableCell dir="ltr" className="text-right text-xs text-muted-foreground">{r.location || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

/* ============== PAYROLL TAB ============== */
function PayrollTab({ employeeId, emp }: { employeeId: string; emp: any }) {
  const { data: slips, loading } = useCollection<SlipData>("payroll", [orderBy("month", "desc")]);
  const empSlips = slips.filter((s) => s.employeeId === employeeId);
  const [selectedSlip, setSelectedSlip] = useState<SlipData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Wallet className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">تاريخ الرواتب والمفردات</h3>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-right">الشهر</TableHead>
              <TableHead className="text-right">الراتب الأساسي</TableHead>
              <TableHead className="text-right">البدلات</TableHead>
              <TableHead className="text-right">الخصومات</TableHead>
              <TableHead className="text-right">الصافي</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
            {!loading && empSlips.length === 0 && <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">لا توجد كشوفات راتب مسجلة.</TableCell></TableRow>}
            {empSlips.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.month}</TableCell>
                <TableCell>{formatEGP(s.base)}</TableCell>
                <TableCell className="text-success">+{formatEGP(s.allow)}</TableCell>
                <TableCell className="text-destructive">-{formatEGP(s.deduct)}</TableCell>
                <TableCell className="font-bold">{formatEGP(s.net)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={s.status === "مدفوع" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedSlip(s); setModalOpen(true); }}>
                    <FileText className="ml-1 h-4 w-4" />
                    عرض الكشف
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PayslipModal open={modalOpen} setOpen={setModalOpen} slip={selectedSlip} employee={emp} />
    </Card>
  );
}

void IdCard;