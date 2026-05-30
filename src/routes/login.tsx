import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, login, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error("Firebase غير مهيأ — يرجى إضافة بيانات الإعداد في src/lib/firebase.ts");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("تم تسجيل الدخول بنجاح");
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error("فشل تسجيل الدخول", { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background px-4">
      <Card className="w-full max-w-md p-8 shadow-[var(--shadow-elevated)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">EN TEC HRMS</h1>
          <p className="mt-1 text-sm text-muted-foreground">نظام إدارة الموارد البشرية</p>
        </div>

        {!configured && (
          <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
            ⚠️ يرجى إضافة إعدادات Firebase في <code>src/lib/firebase.ts</code> أو متغيرات البيئة <code>VITE_FIREBASE_*</code>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@entec.com" dir="ltr" className="text-right" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">كلمة المرور</Label>
              <Link to="/forgot-password" className="text-xs text-accent hover:underline">نسيت كلمة المرور؟</Link>
            </div>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" className="text-right" />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تسجيل الدخول
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ليس لديك حساب؟ <Link to="/register" className="text-accent hover:underline">إنشاء حساب</Link>
        </p>
      </Card>
    </div>
  );
}
