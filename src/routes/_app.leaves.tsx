import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarOff, CalendarCheck, CalendarX, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCollection, addItem, updateItem, orderBy } from "@/lib/use-collection";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/leaves")({
  component: LeavesPage,
});

interface Leave {
  id?: string;
  employeeId: string;
  employeeName: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: string;
  reason?: string;
  isPermission?: boolean;
  startTime?: string;
  endTime?: string;
  deductionAmount?: number;
  unpaid?: boolean;
}

function tone(s: string) {
  if (s === "موافق عليها") return "bg-success/15 text-success";
  if (s === "بانتظار الموافقة") return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

const emptyLeave: Leave = { employeeId: "", employeeName: "", type: "سنوية", from: "", to: "", days: 0, status: "بانتظار الموافقة", reason: "", isPermission: false };

function LeavesPage() {
  const { data: employees } = useCollection<{ name: string; id: string }>("employees");
  const { data: requests, loading } = useCollection<Leave>("leaves", [orderBy("createdAt", "desc")]);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Leave>(emptyLeave);

  const stats = useMemo(() => ({
    active: requests.filter((r) => r.status === "موافق عليها").length,
    pending: requests.filter((r) => r.status === "بانتظار الموافقة").length,
    rejected: requests.filter((r) => r.status === "مرفوضة").length,
    approved: requests.filter((r) => r.status === "موافق عليها").length,
  }), [requests]);

  const calcDays = (from: string, to: string) => {
    if (!from || !to) return 0;
    const d = Math.round((+new Date(to) - +new Date(from)) / 86400000) + 1;
    return d > 0 ? d : 0;
  };

  const submit = async () => {
    if (!data.employeeId || !data.from) return toast.error("املأ كل الحقول المطلوبة");
    if (data.type !== "إذن" && !data.to) return toast.error("حدد تاريخ النهاية");
    if (data.type === "إذن" && (!data.startTime || !data.endTime)) return toast.error("حدد وقت الإذن");

    const emp = employees.find((e) => e.id === data.employeeId);
    
    const isPermission = data.type === "إذن";
    const toDate = isPermission ? data.from : data.to;
    const days = isPermission ? 0 : calcDays(data.from, data.to);
    const unpaid = data.type === "بدون راتب";

    await addItem("leaves", { 
      ...data, 
      employeeName: emp?.name || "", 
      days,
      to: toDate,
      isPermission,
      unpaid
    });
    toast.success("تم تقديم الطلب");
    setData(emptyLeave);
    setOpen(false);
  };

  const decide = async (id: string, status: string) => {
    await updateItem("leaves", id, { status });
    toast.success(status);
  };

  const updateDeduction = async (id: string, val: string) => {
    await updateItem("leaves", id, { deductionAmount: Number(val) || 0 });
    toast.success("تم تحديث قيمة الخصم");
  };

  return (
    <div>
      <PageHeader
        title="الإجازات والأذونات"
        subtitle="طلبات الإجازات، الرصيد، والموافقات"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />طلب جديد</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>طلب جديد</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>الموظف</Label>
                  <Select value={data.employeeId} onValueChange={(v) => setData((s) => ({ ...s, employeeId: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                    <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>النوع</Label>
                  <Select value={data.type} onValueChange={(v) => setData((s) => ({ ...s, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["سنوية", "مرضية", "طارئة", "أمومة", "بدون راتب", "إذن"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {data.type !== "إذن" ? (
                  <>
                    <div className="space-y-1.5"><Label>الأيام</Label><Input dir="ltr" className="text-right" readOnly value={calcDays(data.from, data.to)} /></div>
                    <div className="space-y-1.5"><Label>من</Label><Input type="date" dir="ltr" className="text-right" value={data.from} onChange={(e) => setData((s) => ({ ...s, from: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>إلى</Label><Input type="date" dir="ltr" className="text-right" value={data.to} onChange={(e) => setData((s) => ({ ...s, to: e.target.value }))} /></div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5"><Label>التاريخ</Label><Input type="date" dir="ltr" className="text-right" value={data.from} onChange={(e) => setData((s) => ({ ...s, from: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>وقت البداية</Label><Input type="time" dir="ltr" className="text-right" value={data.startTime} onChange={(e) => setData((s) => ({ ...s, startTime: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>وقت النهاية</Label><Input type="time" dir="ltr" className="text-right" value={data.endTime} onChange={(e) => setData((s) => ({ ...s, endTime: e.target.value }))} /></div>
                  </>
                )}

                {(data.type === "إذن" || data.type === "بدون راتب") && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>قيمة الخصم الثابتة (اختياري - اترك فارغ للحساب الآلي)</Label>
                    <Input type="number" dir="ltr" className="text-right" value={data.deductionAmount || ""} onChange={(e) => setData((s) => ({ ...s, deductionAmount: Number(e.target.value) }))} />
                  </div>
                )}

                <div className="space-y-1.5 sm:col-span-2"><Label>السبب</Label><Textarea value={data.reason} onChange={(e) => setData((s) => ({ ...s, reason: e.target.value }))} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={submit}>إرسال</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="نشطة / أذونات" value={String(stats.active)} icon={CalendarOff} tone="accent" />
        <StatCard title="موافق عليها" value={String(stats.approved)} icon={CalendarCheck} tone="success" />
        <StatCard title="بانتظار المراجعة" value={String(stats.pending)} icon={CalendarOff} tone="warning" />
        <StatCard title="مرفوضة" value={String(stats.rejected)} icon={CalendarX} tone="destructive" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border p-4"><h3 className="text-base font-semibold">الطلبات</h3></div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">التفاصيل</TableHead>
                <TableHead className="text-right">الخصم الإضافي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
              {!loading && requests.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">لا توجد طلبات</TableCell></TableRow>}
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.employeeName}</TableCell>
                  <TableCell>
                    {r.type}
                    {r.isPermission && <Badge variant="secondary" className="mr-2">إذن</Badge>}
                  </TableCell>
                  <TableCell dir="ltr" className="text-right">
                    {r.isPermission ? (
                      <span className="text-xs">{r.from} | {r.startTime} - {r.endTime}</span>
                    ) : (
                      <span className="text-xs">{r.from} إلى {r.to} ({r.days} أيام)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(r.type === "بدون راتب" || r.isPermission) ? (
                        <Input 
                          type="number" 
                          defaultValue={r.deductionAmount || ""} 
                          onBlur={(e) => updateDeduction(r.id!, e.target.value)}
                          className="h-8 w-24 px-2 text-right text-xs" 
                          placeholder="مع الراتب"
                          title="اتركه فارغاً ليقوم النظام بحسابه تلقائياً وقت الراتب. أدخل رقماً هنا فقط إذا أردت خصم مبلغ ثابت."
                        />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline" className={tone(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell>
                    {r.status === "بانتظار الموافقة" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-success" onClick={() => decide(r.id!, "موافق عليها")}>اعتماد</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => decide(r.id!, "مرفوضة")}>رفض</Button>
                      </div>
                    )}
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
