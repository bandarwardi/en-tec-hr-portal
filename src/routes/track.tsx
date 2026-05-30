import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCollection } from "@/lib/use-collection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, Search, CheckCircle2, Clock, XCircle, 
  ArrowRight, Calendar, MapPin, ExternalLink 
} from "lucide-react";

export const Route = createFileRoute("/track")({
  component: TrackPage,
});

function TrackPage() {
  const [appNumber, setAppNumber] = useState("");
  const [searched, setSearched] = useState(false);
  const { data: applicants, loading } = useCollection<any>("applicants");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("last_application");
    if (saved) setAppNumber(saved);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appNumber.trim()) return;
    setSearched(true);
    
    const found = applicants.find((a: any) => a.applicationNumber === appNumber.trim());
    setResult(found || null);
  };

  const getStatusIcon = (status: string) => {
    if (status === "مقبول" || status === "توظيف") return <CheckCircle2 className="h-12 w-12 text-success" />;
    if (status === "مرفوض") return <XCircle className="h-12 w-12 text-destructive" />;
    if (status === "مقابلة") return <Calendar className="h-12 w-12 text-warning" />;
    return <Clock className="h-12 w-12 text-blue-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "مقبول" || status === "توظيف") return "bg-success/10 text-success border-success/20";
    if (status === "مرفوض") return "bg-destructive/10 text-destructive border-destructive/20";
    if (status === "مقابلة") return "bg-warning/10 text-warning border-warning/20";
    return "bg-blue-500/10 text-blue-600 border-blue-200";
  };

  const formatDateTime = (dtStr?: string) => {
    if (!dtStr) return "—";
    try {
      const d = new Date(dtStr);
      return d.toLocaleString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (e) {
      return dtStr;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background px-4 py-12" dir="rtl">
      <Card className="w-full max-w-lg p-8 shadow-[var(--shadow-elevated)] relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">تتبع حالة الطلب</h1>
            <p className="mt-2 text-sm text-muted-foreground">أدخل رقم الطلب الخاص بك لمعرفة آخر المستجدات</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4 mb-8">
            <div className="space-y-2">
              <Label htmlFor="appNumber" className="sr-only">رقم الطلب</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="appNumber" 
                  value={appNumber} 
                  onChange={(e) => setAppNumber(e.target.value)} 
                  placeholder="مثال: APP-123456" 
                  dir="ltr" 
                  className="pr-10 text-center font-mono text-lg h-12 tracking-widest uppercase" 
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={loading || !appNumber.trim()}>
              {loading ? "جاري التحميل..." : "بحث"}
            </Button>
          </form>

          {searched && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {result ? (
                <div className={`rounded-xl border p-6 flex flex-col items-center text-center ${getStatusColor(result.status)}`}>
                  <div className="mb-4">{getStatusIcon(result.status)}</div>
                  <h3 className="text-xl font-bold mb-1">
                    {result.status === "مقابلة" ? "تمت جدولة مقابلة شخصية" : result.status === "توظيف" ? "مقبول (تم التوظيف)" : result.status}
                  </h3>
                  <p className="text-xs opacity-80 mb-4">
                    آخر تحديث للحالة: {result.updatedAt ? new Date(result.updatedAt.toDate()).toLocaleDateString('ar-EG') : result.date}
                  </p>
                  
                  <div className="w-full bg-background/50 rounded-lg p-4 text-right mt-2 space-y-1">
                    <div>
                      <span className="text-xs opacity-75 font-medium">الوظيفة المتقدم لها: </span>
                      <span className="font-bold text-foreground">{result.jobTitle}</span>
                    </div>
                    <div>
                      <span className="text-xs opacity-75 font-medium">اسم المتقدم: </span>
                      <span className="font-semibold text-foreground">{result.name}</span>
                    </div>
                  </div>

                  {/* Interview details if status is interview */}
                  {result.status === "مقابلة" && (
                    <div className="w-full bg-background border border-warning/30 rounded-lg p-4 text-right mt-3 space-y-2 shadow-inner">
                      <h4 className="font-bold text-sm text-warning border-b border-warning/20 pb-1.5 mb-2 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>تفاصيل المقابلة الشخصية</span>
                      </h4>
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="text-xs text-muted-foreground block">تاريخ ووقت المقابلة:</span>
                          <span className="font-bold text-foreground">{formatDateTime(result.interviewDateTime)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">مكان المقابلة:</span>
                          <span className="font-semibold text-foreground">{result.interviewLocation || "—"}</span>
                        </div>
                        {result.interviewMapLink && (
                          <div className="pt-1">
                            <a 
                              href={result.interviewMapLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-accent hover:underline bg-background border px-3 py-2 rounded-lg shadow-sm w-full justify-center"
                            >
                              <MapPin className="h-4 w-4 text-warning" />
                              <span>عرض موقع المقابلة على خرائط جوجل</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center text-center text-destructive">
                  <XCircle className="h-10 w-10 mb-3 opacity-80" />
                  <h3 className="font-semibold">لم يتم العثور على الطلب</h3>
                  <p className="text-sm mt-1 opacity-80">يرجى التأكد من كتابة رقم الطلب بشكل صحيح والمحاولة مرة أخرى.</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-center border-t pt-6">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/login" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                العودة للرئيسية
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
