import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const [loadingSales, setLoadingSales] = useState(false);

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
    
    setLoadingSales(true);
    let crmSales: { email: string; totalSalesUSD: number }[] = [];
    try {
      const response = await fetch(`http://localhost:3000/api/hr-sales-summary?month=${month}&apiKey=entec_hr_secret_key_2026`);
      if (response.ok) {
        crmSales = await response.json();
      }
    } catch (err) {
      console.warn("Failed to fetch CRM sales:", err);
    } finally {
      setLoadingSales(false);
    }

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

      // Calculate CRM sales achievements
      const hasBonus = !!e.hasTargetAndBonus;
      const salesRecord = hasBonus ? crmSales.find((s) => s.email?.toLowerCase() === e.email?.toLowerCase()) : null;
      const usd = salesRecord ? salesRecord.totalSalesUSD : 0;
      let salesBonus = 0;
      if (hasBonus && usd >= 1500 && usd < 2000) {
        salesBonus = 500;
      } else if (hasBonus && usd >= 2000) {
        salesBonus = 1000;
      }
      const salesTarget = hasBonus ? usd * 2.5 : 0;

      const fixedDeduct = Math.round(base * (ins + tax));
      const totalAllow = baseAllow + customAllow + salesBonus + salesTarget;
      const totalDeduct = fixedDeduct + automated.total + customDeduct;
      const net = base + totalAllow - totalDeduct;

      let breakdown = `تأمينات وضرائب: ${fixedDeduct} | ${automated.breakdown}`;
      if (usd > 0) {
        breakdown += ` | مبيعات: ${usd}$ (بونص: ${salesBonus} + تارجت: ${salesTarget})`;
      }
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
        breakdown,
        salesUSD: usd,
        salesBonus,
        salesTarget
      });
    }
    toast.success("تم إنشاء كشف الرواتب تلقائياً وسحب مبيعات الـ CRM");
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

  const updateSalesUSD = async (slip: Slip, usd: number, showToast = true) => {
    const emp = employees.find((x) => x.id === slip.employeeId);
    const hasBonus = !!emp?.hasTargetAndBonus;

    let bonus = 0;
    if (hasBonus && usd >= 1500 && usd < 2000) {
      bonus = 500;
    } else if (hasBonus && usd >= 2000) {
      bonus = 1000;
    }
    const target = hasBonus ? usd * 2.5 : 0;

    const prevBonus = (slip as any).salesBonus || 0;
    const prevTarget = (slip as any).salesTarget || 0;
    const baselineAllow = (slip.allow || 0) - prevBonus - prevTarget;
    const newAllow = baselineAllow + bonus + target;
    const newNet = slip.base + newAllow - slip.deduct;

    const baseBreakdown = slip.breakdown?.split(" | مبيعات:")[0] || "";
    const newBreakdown = usd > 0 
      ? `${baseBreakdown} | مبيعات: ${usd}$ (بونص: ${bonus} + تارجت: ${target})`
      : baseBreakdown;

    try {
      await updateItem("payroll", slip.id!, {
        salesUSD: usd,
        salesBonus: bonus,
        salesTarget: target,
        allow: newAllow,
        net: newNet,
        breakdown: newBreakdown
      });
      if (showToast) toast.success("تم تحديث مبيعات الموظف والراتب الصافي");
    } catch (err: any) {
      toast.error("فشل التحديث", { description: err.message });
    }
  };

  const syncCrmSales = async () => {
    if (slips.length === 0) return toast.error("لا توجد كشوفات رواتب لهذا الشهر. يرجى إنشاء الكشوفات أولاً.");
    
    setLoadingSales(true);
    try {
      const response = await fetch(`http://localhost:3000/api/hr-sales-summary?month=${month}&apiKey=entec_hr_secret_key_2026`);
      if (!response.ok) {
        throw new Error("فشل الاتصال بنظام الـ CRM");
      }
      const crmSales: { email: string; totalSalesUSD: number }[] = await response.json();
      
      let count = 0;
      for (const slip of slips) {
        const emp = employees.find((x) => x.id === slip.employeeId);
        if (!emp || !emp.email) continue;
        
        const salesRecord = crmSales.find((s) => s.email?.toLowerCase() === emp.email?.toLowerCase());
        const usd = salesRecord ? salesRecord.totalSalesUSD : 0;
        
        await updateSalesUSD(slip, usd, false);
        count++;
      }
      toast.success(`تم تحديث مبيعات الموظفين تلقائياً بنجاح (${count} موظف).`);
    } catch (err: any) {
      toast.error("فشل سحب المبيعات من الـ CRM", { description: err.message });
    } finally {
      setLoadingSales(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ["الشهر", "الموظف", "الأساسي", "المبيعات ($)", "البدلات", "الخصومات", "الصافي", "الحالة", "التفاصيل"],
      ...slips.map((s) => [s.month, s.employeeName, s.base, (s as any).salesUSD || 0, s.allow, s.deduct, s.net, s.status, s.breakdown || ""]),
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
              <>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={deleteAllSlips}>
                  <Trash2 className="ml-2 h-4 w-4" />حذف كشوفات الشهر
                </Button>
                <Button variant="outline" onClick={syncCrmSales} disabled={loadingSales} className="border-primary text-primary hover:bg-primary/10">
                  {loadingSales ? "جاري التحديث..." : "تحديث المبيعات من CRM"}
                </Button>
              </>
            )}
            <Button onClick={generate} disabled={slips.length > 0 || loadingSales}><Receipt className="ml-2 h-4 w-4" />{loadingSales ? "جاري الإنشاء..." : "إنشاء كشف الشهر"}</Button>
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
                <TableHead className="text-right">المبيعات ($)</TableHead>
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
                  <TableCell>
                    {isSalesEmployee(employees.find((emp: any) => emp.id === s.employeeId)?.role) ? (
                      <Input
                        type="number"
                        value={(s as any).salesUSD === 0 ? "" : (s as any).salesUSD || ""}
                        onChange={(e) => updateSalesUSD(s, Number(e.target.value) || 0)}
                        placeholder="0$"
                        className="w-24 text-right h-8"
                        disabled={s.status === "مدفوع"}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
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

function isSalesEmployee(role?: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r.includes("سيلز") || r.includes("مبيعات") || r.includes("sales");
}
