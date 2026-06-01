import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, Receipt, Download, FileText, Trash2 } from "lucide-react";
import { useCollection, addItem, updateItem, deleteItem, getDocOnce, orderBy } from "@/lib/use-collection";
import { toast } from "sonner";
import { formatEGP, CURRENCY_LABEL } from "@/lib/currency";
import { calcEmployeeDeductions } from "@/lib/payroll-calc";
import { PayslipModal } from "@/components/payroll/PayslipModal";
import { defaultSettings } from "@/lib/settings-hook";

export const Route = createFileRoute("/_app/payroll")({
  component: PayrollPage,
});

interface Slip {
  id?: string;
  month: string;
  employeeId: string;
  employeeName: string;
  base: number;
  allow: number;
  deduct: number;
  net: number;
  status: string;
  breakdown?: string;
}

const currentMonth = () => new Date().toISOString().slice(0, 7);

function PayrollPage() {
  const [month, setMonth] = useState(currentMonth());
  const [selectedSlip, setSelectedSlip] = useState<Slip | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: employees } = useCollection<any>("employees");
  const { data: allSlips, loading } = useCollection<Slip>("payroll", [orderBy("createdAt", "desc")]);
  const { data: attendance } = useCollection<any>("attendance");
  const { data: leaves } = useCollection<any>("leaves");
  const { data: adjustments } = useCollection<any>("adjustments");

  const slips = useMemo(() => allSlips.filter((s) => s.month === month), [allSlips, month]);

  const totals = useMemo(() => {
    const base = slips.reduce((s, x) => s + (x.base || 0), 0);
    const allow = slips.reduce((s, x) => s + (x.allow || 0), 0);
    const deduct = slips.reduce((s, x) => s + (x.deduct || 0), 0);
    const net = slips.reduce((s, x) => s + (x.net || 0), 0);
    return { base, allow, deduct, net };
  }, [slips]);

  const generate = async () => {
    if (slips.length > 0) return toast.error("كشف هذا الشهر موجود مسبقاً");
    if (employees.length === 0) return toast.error("لا يوجد موظفون");
    
    // Fetch exact settings document to guarantee we don't rely on cached or partial collection array
    const d = await getDocOnce("settings_doc", "general");
    const dbSettings = d || {};
    const appSettings = { ...defaultSettings, ...dbSettings };
    const ins = (appSettings.insuranceRate ?? 10) / 100;
    const tax = (appSettings.taxRate ?? 0) / 100;

    const monthAdjustments = adjustments.filter((adj) => adj.month === month);

    for (const e of employees) {
      const base = Number(e.baseSalary || 0);
      const baseAllow = Number(e.allowance || 0);
      
      const empAdjs = monthAdjustments.filter((adj) => adj.employeeId === e.id);
      const customAllow = empAdjs.filter((a) => a.type === "allowance").reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const customDeduct = empAdjs.filter((a) => a.type === "deduction").reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

      // Calculate automated deductions
      const automated = calcEmployeeDeductions({
        employeeId: e.id,
        baseSalary: base,
        month,
        attendance,
        leaves,
        settings: appSettings,
      });

      const fixedDeduct = Math.round(base * (ins + tax));
      const totalAllow = baseAllow + customAllow;
      const totalDeduct = fixedDeduct + automated.total + customDeduct;
      const net = base + totalAllow - totalDeduct;

      let breakdown = `تأمينات وضرائب: ${fixedDeduct} | ${automated.breakdown}`;
      if (customAllow > 0) {
        const reasons = empAdjs.filter((a) => a.type === "allowance").map((a) => a.reason).join(", ");
        breakdown += ` | علاوات إضافية: ${customAllow} (${reasons})`;
      }
      if (customDeduct > 0) {
        const reasons = empAdjs.filter((a) => a.type === "deduction").map((a) => a.reason).join(", ");
        breakdown += ` | خصومات إضافية: ${customDeduct} (${reasons})`;
      }

      await addItem("payroll", {
        month, 
        employeeId: e.id, 
        employeeName: e.name,
        base, 
        allow: totalAllow, 
        deduct: totalDeduct, 
        net, 
        status: "بانتظار الدفع",
        breakdown
      });
    }
    toast.success("تم إنشاء كشف الرواتب والتلقائي");
  };

  const markPaid = async (id: string) => {
    await updateItem("payroll", id, { status: "مدفوع" });
    toast.success("تم تسجيل الدفع");
  };

  const deleteSlip = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكشف؟ (يمكنك إعادة إنشائه لاحقاً من زر إنشاء كشف الشهر)")) return;
    await deleteItem("payroll", id);
    toast.success("تم حذف الكشف");
  };

  const deleteAllSlips = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع كشوفات هذا الشهر بالكامل لإعادة حسابها؟")) return;
    for (const s of slips) {
      if (s.id) await deleteItem("payroll", s.id);
    }
    toast.success("تم حذف جميع كشوفات الشهر");
  };

  const exportCsv = () => {
    const rows = [
      ["الشهر", "الموظف", "الأساسي", "البدلات", "الخصومات", "الصافي", "الحالة", "التفاصيل"],
      ...slips.map((s) => [s.month, s.employeeName, s.base, s.allow, s.deduct, s.net, s.status, s.breakdown || ""]),
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c ?? "")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `payroll-${month}.csv`; a.click();
  };

  return (
    <div>
      <PageHeader
        title="الرواتب"
        subtitle="كشوفات الرواتب، البدلات، الخصومات والمكافآت (مع الأتمتة)"
        actions={
          <>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border border-input bg-background px-3 py-1.5 text-sm" dir="ltr" />
            <Button variant="outline" onClick={exportCsv}><Download className="ml-2 h-4 w-4" />تصدير</Button>
            {slips.length > 0 && (
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={deleteAllSlips}>
                <Trash2 className="ml-2 h-4 w-4" />حذف كشوفات الشهر
              </Button>
            )}
            <Button onClick={generate} disabled={slips.length > 0}><Receipt className="ml-2 h-4 w-4" />إنشاء كشف الشهر</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={`إجمالي الأساسي`} value={formatEGP(totals.base)} icon={Wallet} tone="primary" />
        <StatCard title="البدلات" value={formatEGP(totals.allow)} icon={TrendingUp} tone="success" />
        <StatCard title="الخصومات" value={formatEGP(totals.deduct)} icon={Receipt} tone="warning" />
        <StatCard title="صافي الرواتب" value={formatEGP(totals.net)} icon={Wallet} tone="accent" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-base font-semibold">كشف الرواتب — {month}</h3>
          <Badge variant="outline" className="bg-accent text-accent-foreground">{CURRENCY_LABEL}</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">الراتب الأساسي</TableHead>
                <TableHead className="text-right">البدلات</TableHead>
                <TableHead className="text-right">الخصومات</TableHead>
                <TableHead className="text-right">الصافي</TableHead>
                <TableHead className="text-right">التفاصيل</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">جاري التحميل...</TableCell></TableRow>}
              {!loading && slips.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">لا يوجد كشف لهذا الشهر — اضغط "إنشاء كشف الشهر"</TableCell></TableRow>}
              {slips.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.employeeName}</TableCell>
                  <TableCell>{formatEGP(s.base)}</TableCell>
                  <TableCell className="text-success">+{formatEGP(s.allow)}</TableCell>
                  <TableCell className="text-destructive">-{formatEGP(s.deduct)}</TableCell>
                  <TableCell className="font-bold">{formatEGP(s.net)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={s.breakdown}>{s.breakdown}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.status === "مدفوع" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedSlip(s); setModalOpen(true); }}>
                        <FileText className="ml-1 h-4 w-4" />
                        عرض الكشف
                      </Button>
                      {s.status !== "مدفوع" && s.id && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => markPaid(s.id!)}>
                            تسجيل دفع
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => deleteSlip(s.id!)} title="حذف وإعادة حساب">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <PayslipModal 
        open={modalOpen} 
        setOpen={setModalOpen} 
        slip={selectedSlip as any}
        employee={employees.find((e: any) => e.id === selectedSlip?.employeeId)}
      />
    </div>
  );
}
