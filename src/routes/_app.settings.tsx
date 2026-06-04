import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Wallet, CalendarCheck, TimerOff, Save } from "lucide-react";
import { setDocItem, getDocOnce } from "@/lib/use-collection";
import { toast } from "sonner";
import { defaultSettings, type AppSettings } from "@/lib/settings-hook";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [data, setData] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await getDocOnce("settings_doc", "general");
      if (d) setData({ ...defaultSettings, ...(d as any) });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await setDocItem("settings_doc", "general", data);
      toast.success("تم حفظ الإعدادات — سيتم تطبيقها تلقائياً على الرواتب والحضور.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setData((s) => ({ ...s, [k]: v }));

  if (loading) return <p className="text-muted-foreground">جاري التحميل...</p>;

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="كل الإعدادات مرتبطة فعلياً بالحضور والرواتب والتقارير" />

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
            <div className="space-y-1.5 sm:col-span-2"><Label>أيام العمل في الشهر (للحساب)</Label><Input type="number" dir="ltr" className="text-right" value={data.workingDaysPerMonth} onChange={(e) => set("workingDaysPerMonth", Number(e.target.value))} /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning"><CalendarCheck className="h-5 w-5" /></div>
            <h3 className="text-base font-semibold">الحضور والتأخير</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>بداية الدوام الرسمي</Label><Input type="time" dir="ltr" className="text-right" value={data.workStart} onChange={(e) => set("workStart", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>نهاية الدوام</Label><Input type="time" dir="ltr" className="text-right" value={data.workEnd} onChange={(e) => set("workEnd", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>فترة السماح (دقيقة)</Label><Input type="number" dir="ltr" className="text-right" value={data.lateMinutes} onChange={(e) => set("lateMinutes", Number(e.target.value))} /></div>
            <div className="space-y-1.5">
              <Label>خصم الدقيقة للتأخير (%) من الراتب</Label>
              <Input type="number" step="0.001" dir="ltr" className="text-right" value={data.lateDeductionPerMinute} onChange={(e) => set("lateDeductionPerMinute", Number(e.target.value))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>أيام العمل الأسبوعية</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: "الأحد", value: 0 },
                  { label: "الإثنين", value: 1 },
                  { label: "الثلاثاء", value: 2 },
                  { label: "الأربعاء", value: 3 },
                  { label: "الخميس", value: 4 },
                  { label: "الجمعة", value: 5 },
                  { label: "السبت", value: 6 },
                ].map((day) => {
                  const isSelected = (data.workingDays || [0, 1, 2, 3, 4]).includes(day.value);
                  return (
                    <Button
                      key={day.value}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`h-9 px-3 text-xs cursor-pointer ${isSelected ? "bg-primary text-primary-foreground font-bold hover:bg-primary/90" : "hover:bg-accent"}`}
                      onClick={() => {
                        const current = data.workingDays || [0, 1, 2, 3, 4];
                        const next = current.includes(day.value)
                          ? current.filter((v) => v !== day.value)
                          : [...current, day.value];
                        set("workingDays", next.sort((a, b) => a - b));
                      }}
                    >
                      {day.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="mt-3 rounded-md bg-warning/10 p-2 text-xs text-warning">مثال: تأخير 30 دقيقة − سماح 10 = 20 × سعر/دقيقة = الخصم.</p>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><TimerOff className="h-5 w-5" /></div>
            <h3 className="text-base font-semibold">الخصومات (غياب / بدون راتب / أذونات)</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>خصم يوم الغياب (%) من الراتب</Label>
              <Input type="number" step="0.01" dir="ltr" className="text-right" value={data.absenceDeductionPerDay} onChange={(e) => set("absenceDeductionPerDay", Number(e.target.value))} />
              <p className="text-[11px] text-muted-foreground">اتركه 0 للاعتماد التلقائي (الراتب ÷ 26، أي حوالي 3.85%).</p>
            </div>
            <div className="space-y-1.5">
              <Label>خصم يوم بدون راتب (%) من الراتب</Label>
              <Input type="number" step="0.01" dir="ltr" className="text-right" value={data.unpaidLeavePerDay} onChange={(e) => set("unpaidLeavePerDay", Number(e.target.value))} />
              <p className="text-[11px] text-muted-foreground">اتركه 0 للاعتماد التلقائي (الراتب ÷ 30، أي حوالي 3.33%).</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>خصم دقيقة الإذن (%) من الراتب</Label>
              <Input type="number" step="0.001" dir="ltr" className="text-right" value={data.permissionDeductionPerMinute} onChange={(e) => set("permissionDeductionPerMinute", Number(e.target.value))} />
              <p className="text-[11px] text-muted-foreground">يُطبَّق كنسبة مئوية من مرتب الموظف لكل دقيقة إذن (مثال: 0.03% تعادل 3 جنيه لراتب 10,000).</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}><Save className="ml-2 h-4 w-4" />{saving ? "...جاري الحفظ" : "حفظ الإعدادات"}</Button>
      </div>
    </div>
  );
}