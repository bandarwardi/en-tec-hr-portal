import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Coins } from "lucide-react";
import { useCollection, addItem, deleteItem, orderBy } from "@/lib/use-collection";
import { toast } from "sonner";
import { formatEGP, CURRENCY_LABEL } from "@/lib/currency";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/adjustments")({
  component: AdjustmentsPage,
});

const currentMonth = () => new Date().toISOString().slice(0, 7);

function AdjustmentsPage() {
  const [month, setMonth] = useState(currentMonth());
  
  // Custom Adjustments Form State
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjEmpId, setAdjEmpId] = useState("");
  const [adjType, setAdjType] = useState<"allowance" | "deduction">("allowance");
  const [adjReason, setAdjReason] = useState("");
  const [adjCustomReason, setAdjCustomReason] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjDate, setAdjDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: employees } = useCollection<any>("employees");
  const { data: adjustments, loading } = useCollection<any>("adjustments", [orderBy("createdAt", "desc")]);

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((adj) => adj.month === month);
  }, [adjustments, month]);

  const addAdjustment = async () => {
    if (!adjEmpId) return toast.error("يرجى اختيار الموظف");
    if (!adjAmount || Number(adjAmount) <= 0) return toast.error("يرجى إدخال مبلغ صحيح");
    
    const emp = employees.find((e: any) => e.id === adjEmpId);
    if (!emp) return toast.error("لم يتم العثور على الموظف");

    const finalReason = adjReason === "أخرى" ? adjCustomReason.trim() : adjReason;
    if (!finalReason) return toast.error("يرجى تحديد أو كتابة سبب التعديل");

    try {
      await addItem("adjustments", {
        employeeId: adjEmpId,
        employeeName: emp.name,
        type: adjType,
        amount: Number(adjAmount),
        reason: finalReason,
        month: adjDate.slice(0, 7),
        date: adjDate,
      });
      toast.success("تمت إضافة التعديل بنجاح");
      setAdjModalOpen(false);
      // Clear fields
      setAdjEmpId("");
      setAdjReason("");
      setAdjCustomReason("");
      setAdjAmount("");
    } catch (err: any) {
      toast.error("فشل إضافة التعديل", { description: err.message });
    }
  };

  const deleteAdjustment = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التعديل؟")) return;
    try {
      await deleteItem("adjustments", id);
      toast.success("تم حذف التعديل بنجاح");
    } catch (err: any) {
      toast.error("فشل حذف التعديل", { description: err.message });
    }
  };

  return (
    <div>
      <PageHeader
        title="العلاوات والخصومات المخصصة"
        subtitle="إدارة العلاوات والخصومات الاستثنائية وتأثيرها على الراتب الحالي للموظفين"
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              dir="ltr"
            />
            
            <Dialog open={adjModalOpen} onOpenChange={setAdjModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="ml-2 h-4 w-4" />إضافة علاوة / خصم
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader className="text-right">
                  <DialogTitle className="text-right">إضافة علاوة أو خصم مخصص</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 text-right">
                  <div className="space-y-1.5">
                    <Label>الموظف</Label>
                    <Select value={adjEmpId} onValueChange={setAdjEmpId}>
                      <SelectTrigger className="w-full text-right" dir="rtl">
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="text-right">
                        {employees.map((e: any) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>النوع</Label>
                    <Select value={adjType} onValueChange={(v: any) => { setAdjType(v); setAdjReason(""); }}>
                      <SelectTrigger className="w-full text-right" dir="rtl">
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="text-right">
                        <SelectItem value="allowance">علاوة (مستحقات)</SelectItem>
                        <SelectItem value="deduction">خصم (استقطاعات)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>السبب</Label>
                    <Select value={adjReason} onValueChange={setAdjReason}>
                      <SelectTrigger className="w-full text-right" dir="rtl">
                        <SelectValue placeholder="اختر السبب" />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="text-right">
                        {adjType === "allowance" ? (
                          <>
                            <SelectItem value="بونص أوردرات">بونص أوردرات</SelectItem>
                            <SelectItem value="تحقيق التارجت">تحقيق التارجت</SelectItem>
                            <SelectItem value="تميز في العمل">تميز في العمل</SelectItem>
                            <SelectItem value="أجر إضافي / أوفر تايم">أجر إضافي / أوفر تايم</SelectItem>
                            <SelectItem value="مكافأة خاصة">مكافأة خاصة</SelectItem>
                            <SelectItem value="أخرى">سبب آخر...</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="عدم تحقيق التارجت">عدم تحقيق التارجت</SelectItem>
                            <SelectItem value="إهمال في العمل">إهمال في العمل</SelectItem>
                            <SelectItem value="تلفيات / مفقودات">تلفيات / مفقودات</SelectItem>
                            <SelectItem value="عقوبة إدارية">عقوبة إدارية</SelectItem>
                            <SelectItem value="أخرى">سبب آخر...</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {adjReason === "أخرى" && (
                    <div className="space-y-1.5">
                      <Label>السبب المخصص</Label>
                      <Input
                        value={adjCustomReason}
                        onChange={(e) => setAdjCustomReason(e.target.value)}
                        placeholder="اكتب السبب بالتفصيل"
                        className="text-right"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>المبلغ ({CURRENCY_LABEL})</Label>
                    <Input
                      type="number"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      placeholder="0"
                      className="text-right"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      value={adjDate}
                      onChange={(e) => setAdjDate(e.target.value)}
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 flex justify-end">
                  <Button variant="outline" onClick={() => setAdjModalOpen(false)}>إلغاء</Button>
                  <Button onClick={addAdjustment}>إضافة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-base font-semibold">قائمة التعديلات لشهر {month}</h3>
          <Coins className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">السبب</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredAdjustments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    لا توجد علاوات أو خصومات مضافة لهذا الشهر
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredAdjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell className="font-medium">{adj.employeeName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={adj.type === "allowance" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}>
                      {adj.type === "allowance" ? "علاوة" : "خصم"}
                    </Badge>
                  </TableCell>
                  <TableCell className={adj.type === "allowance" ? "text-success font-bold" : "text-destructive font-bold"}>
                    {adj.type === "allowance" ? "+" : "-"}{formatEGP(adj.amount)}
                  </TableCell>
                  <TableCell>{adj.reason}</TableCell>
                  <TableCell dir="ltr" className="text-right">{adj.date}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => deleteAdjustment(adj.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
