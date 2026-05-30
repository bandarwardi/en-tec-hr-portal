import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Wallet, CalendarCheck, ShieldCheck, Bell } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
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
            <div className="space-y-1.5"><Label>اسم الشركة</Label><Input defaultValue="EN TEC" /></div>
            <div className="space-y-1.5"><Label>الرقم الضريبي</Label><Input dir="ltr" className="text-right" defaultValue="300123456700003" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>العنوان</Label><Input defaultValue="الرياض، المملكة العربية السعودية" /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success"><Wallet className="h-5 w-5" /></div>
            <h3 className="text-base font-semibold">إعدادات الرواتب</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>العملة</Label><Input defaultValue="ر.س" /></div>
            <div className="space-y-1.5"><Label>يوم صرف الراتب</Label><Input type="number" defaultValue={25} /></div>
            <div className="space-y-1.5"><Label>نسبة التأمينات</Label><Input dir="ltr" className="text-right" defaultValue="10%" /></div>
            <div className="space-y-1.5"><Label>نسبة الضريبة</Label><Input dir="ltr" className="text-right" defaultValue="15%" /></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning"><CalendarCheck className="h-5 w-5" /></div>
            <h3 className="text-base font-semibold">إعدادات الحضور</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>بداية الدوام</Label><Input type="time" dir="ltr" className="text-right" defaultValue="08:00" /></div>
            <div className="space-y-1.5"><Label>نهاية الدوام</Label><Input type="time" dir="ltr" className="text-right" defaultValue="17:00" /></div>
            <div className="space-y-1.5"><Label>سماحية التأخير (دقيقة)</Label><Input type="number" defaultValue={10} /></div>
            <div className="space-y-1.5"><Label>أيام العمل</Label><Input defaultValue="السبت - الخميس" /></div>
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
        <Button><Bell className="ml-2 h-4 w-4" />حفظ الإعدادات</Button>
      </div>
    </div>
  );
}
