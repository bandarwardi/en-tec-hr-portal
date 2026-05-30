import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Wallet, CalendarCheck, ShieldCheck, Save } from "lucide-react";
import { setDocItem, getDocOnce } from "@/lib/use-collection";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

interface Settings {
  companyName: string;
  taxNumber: string;
  address: string;
  currency: string;
  payDay: number;
  insuranceRate: number;
  taxRate: number;
  workStart: string;
  workEnd: string;
  lateMinutes: number;
  workDays: string;
}

const defaults: Settings = {
  companyName: "EN TEC",
  taxNumber: "",
  address: "القاهرة، مصر",
  currency: "ج.م",
  payDay: 25,
  insuranceRate: 11,
  taxRate: 10,
  workStart: "09:00",
  workEnd: "17:00",
  lateMinutes: 10,
  workDays: "الأحد - الخميس",
};

function SettingsPage() {
  const [data, setData] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await getDocOnce("settings_doc", "general");
      if (d) setData({ ...defaults, ...(d as any) });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await setDocItem("settings_doc", "general", data);
      toast.success("تم حفظ الإعدادات");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setData((s) => ({ ...s, [k]: v }));

  if (loading) return <p className="text-muted-foreground">جاري التحميل...</p>;

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="إدارة إعدادات الشركة والنظام" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
            <h3 className="text-base font-semibold">بيانات الشركة</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>اسم الشركة</Label><Input value={data.companyName} onChange={(e) => set("companyName", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>الرقم الضريبي</Label><Input dir="ltr" className="text-right" value={data.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>العنوان</Label><Input value={data.address} onChange={(e) => set("address", e.target.value)} /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success"><Wallet className="h-5 w-5" /></div>
            <h3 className="text-base font-semibold">إعدادات الرواتب</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>العملة</Label><Input value={data.currency} onChange={(e) => set("currency", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>يوم صرف الراتب</Label><Input type="number" dir="ltr" className="text-right" value={data.payDay} onChange={(e) => set("payDay", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>نسبة التأمينات %</Label><Input type="number" dir="ltr" className="text-right" value={data.insuranceRate} onChange={(e) => set("insuranceRate", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>نسبة الضريبة %</Label><Input type="number" dir="ltr" className="text-right" value={data.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning"><CalendarCheck className="h-5 w-5" /></div>
            <h3 className="text-base font-semibold">إعدادات الحضور</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>بداية الدوام</Label><Input type="time" dir="ltr" className="text-right" value={data.workStart} onChange={(e) => set("workStart", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>نهاية الدوام</Label><Input type="time" dir="ltr" className="text-right" value={data.workEnd} onChange={(e) => set("workEnd", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>سماحية التأخير (دقيقة)</Label><Input type="number" dir="ltr" className="text-right" value={data.lateMinutes} onChange={(e) => set("lateMinutes", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>أيام العمل</Label><Input value={data.workDays} onChange={(e) => set("workDays", e.target.value)} /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><ShieldCheck className="h-5 w-5" /></div>
            <h3 className="text-base font-semibold">الأدوار والصلاحيات</h3>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-lg border border-border p-3"><span>Super Admin</span><span className="text-xs text-muted-foreground">صلاحيات كاملة</span></li>
            <li className="flex items-center justify-between rounded-lg border border-border p-3"><span>HR Manager</span><span className="text-xs text-muted-foreground">إدارة HR</span></li>
            <li className="flex items-center justify-between rounded-lg border border-border p-3"><span>Department Manager</span><span className="text-xs text-muted-foreground">مدير قسم</span></li>
            <li className="flex items-center justify-between rounded-lg border border-border p-3"><span>Employee</span><span className="text-xs text-muted-foreground">صلاحيات محدودة</span></li>
          </ul>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}><Save className="ml-2 h-4 w-4" />{saving ? "...جاري الحفظ" : "حفظ الإعدادات"}</Button>
      </div>
    </div>
  );
}
