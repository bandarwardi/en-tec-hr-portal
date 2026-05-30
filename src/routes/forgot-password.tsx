import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import logoUrl from "../assets/imgs/logo.jpeg";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPage,
});

function ForgotPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword(email);
      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور");
    } catch (err: any) {
      toast.error("فشل الإرسال", { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background px-4">
      <Card className="w-full max-w-md p-8 shadow-[var(--shadow-elevated)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-background overflow-hidden border border-border/50 shadow-sm">
            <img src={logoUrl} alt="EN TEC" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
          <p className="mt-1 text-sm text-muted-foreground">سنرسل رابط الاستعادة إلى بريدك</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="text-right" />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إرسال الرابط
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/login" className="text-accent hover:underline">العودة لتسجيل الدخول</Link>
        </p>
      </Card>
    </div>
  );
}
