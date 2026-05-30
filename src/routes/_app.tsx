import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // إذا لم تتم تهيئة Firebase نسمح بمعاينة الواجهة بدون تسجيل دخول
    if (!loading && configured && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, configured, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
