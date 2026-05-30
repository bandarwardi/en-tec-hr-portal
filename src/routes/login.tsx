import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Building2, Loader2, Lock, Mail } from "lucide-react";
import logoUrl from "../assets/imgs/logo.jpeg";

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
      toast.error("فشل تسجيل الدخول", { description: err?.message || "تأكد من صحة البريد الإلكتروني وكلمة المرور" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background px-4 relative overflow-hidden">
      
      {/* Background Enterprise Design Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-32 pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <Card className="w-full max-w-md p-8 sm:p-10 shadow-2xl relative z-10 border-border/50 bg-card/95 backdrop-blur">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-lg overflow-hidden border border-border/50">
            <img src={logoUrl} alt="EN TEC" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">EN TEC HRMS</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium">نظام إدارة الموارد البشرية المؤسسي</p>
        </div>

        {!configured && (
          <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 p-4 text-xs text-foreground leading-relaxed">
            <span className="font-bold text-warning mr-1">⚠️ تنبيه النظام:</span> 
            يرجى إضافة إعدادات Firebase في <code>src/lib/firebase.ts</code> أو متغيرات البيئة <code>VITE_FIREBASE_*</code>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@entec.com" 
                dir="ltr" 
                className="text-right pr-10 h-11" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">كلمة المرور</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium transition-colors">نسيت كلمة المرور؟</Link>
            </div>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                dir="ltr" 
                className="text-right pr-10 h-11" 
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full h-11 mt-2 text-base shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "تسجيل الدخول"
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            الدخول مقتصر على موظفي شركة إنتك المصرح لهم فقط.
          </p>
        </div>
      </Card>
      
      {/* Public job portal link */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <Link to="/track" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          هل أنت متقدم لوظيفة؟ تتبع طلبك من هنا
        </Link>
      </div>
    </div>
  );
}
