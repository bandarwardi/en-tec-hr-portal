import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getDocOnce, addItem, updateItem } from "@/lib/use-collection";
import { uploadFile } from "@/lib/upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Briefcase, Building2, MapPin, Loader2, Upload, FileText, 
  CheckCircle2, User, Calendar, GraduationCap, ShieldAlert, 
  Award, Mail, Phone, BookOpen, Clock
} from "lucide-react";
import logoUrl from "../assets/imgs/logo.jpeg";

export const Route = createFileRoute("/jobs/$id")({
  component: PublicJobPage,
});

function PublicJobPage() {
  const { id } = Route.useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [qualification, setQualification] = useState("");
  const [militaryStatus, setMilitaryStatus] = useState("");
  const [experience, setExperience] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getDocOnce("jobs", id) as any;
        if (data && data.status === "مفتوحة") {
          setJob(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const submitApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !birthDate || !qualification || !militaryStatus || !experience) {
      return toast.error("يرجى ملء جميع الحقول المطلوبة");
    }
    
    setSubmitting(true);
    try {
      const cvUrl = file ? await uploadFile(file) : "";
      const appNumber = "APP-" + Math.floor(100000 + Math.random() * 900000);
      
      await addItem("applicants", {
        jobId: id,
        jobTitle: job.title,
        name,
        email,
        phone,
        birthDate,
        qualification,
        militaryStatus,
        experience,
        cvUrl,
        applicationNumber: appNumber,
        status: "جديد",
        date: new Date().toISOString().slice(0, 10)
      });
      
      // Increment applicant count on the job
      await updateItem("jobs", id, {
        applicants: (job.applicants || 0) + 1
      });
      
      localStorage.setItem("last_application", appNumber);
      setTrackingId(appNumber);
      setSubmitted(true);
      toast.success("تم إرسال الطلب بنجاح");
    } catch (err: any) {
      toast.error("فشل إرسال الطلب", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground animate-pulse">جاري تحميل تفاصيل الوظيفة...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <Card className="max-w-md w-full p-8 text-center shadow-xl border border-border/40 backdrop-blur-md bg-card/85 transition-all hover:shadow-2xl duration-300">
          <Briefcase className="mx-auto h-16 w-16 text-muted-foreground opacity-30 mb-5" />
          <h1 className="text-2xl font-bold mb-3">الوظيفة غير متاحة</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            عذراً، هذه الوظيفة إما غير موجودة في النظام حالياً أو تم إغلاق باب التقديم والترشح لها.
          </p>
          <Button asChild className="w-full bg-primary hover:bg-primary/95 text-white shadow-md active:scale-95 transition-all">
            <Link to="/login">العودة للرئيسية</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-sky-50/15 to-slate-100/50 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

        <Card className="max-w-lg w-full p-8 text-center shadow-2xl border border-success/20 backdrop-blur-md bg-card/85 animate-in zoom-in-95 duration-300">
          <div className="mx-auto h-20 w-20 bg-success/10 text-success flex items-center justify-center rounded-full mb-6 shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-success">تم استلام طلبك بنجاح!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            شكراً لاهتمامك بالانضمام إلى فريق عمل **EN TEC**. رقم تتبع الطلب الخاص بك هو:
          </p>
          <div className="bg-muted border border-border/80 rounded-xl p-4 font-mono text-2xl tracking-wider font-bold text-accent mb-6 select-all shadow-sm">
            {trackingId}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-8">
            يرجى الاحتفاظ برقم التتبع هذا لتتمكن من متابعة حالة طلبك ومواعيد المقابلات الشخصية لاحقاً.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full h-11 bg-accent hover:bg-accent/90 text-white shadow-md active:scale-95 transition-all">
              <Link to="/track">متابعة حالة الطلب</Link>
            </Button>
            <Button variant="outline" asChild className="w-full h-11 active:scale-95 transition-all">
              <Link to="/login">الذهاب لصفحة الدخول</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/15 to-slate-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Visual background enhancements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 bg-background flex items-center justify-center rounded-2xl shadow-lg transform hover:rotate-6 transition-all duration-300 overflow-hidden border border-border/50">
            <img src={logoUrl} alt="EN TEC" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-clip-text bg-gradient-to-r from-primary to-accent">EN TEC Careers</h1>
          <p className="text-muted-foreground text-sm font-medium">بوابة التوظيف الرسمية والتقديم الإلكتروني</p>
        </div>

        {/* Job Details Card */}
        <Card className="overflow-hidden shadow-xl border border-border/40 backdrop-blur-md bg-card/85 hover:shadow-2xl transition-all duration-300 rounded-2xl">
          <div className="border-b border-border/40 bg-muted/30 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-3">
                  <Briefcase className="h-3 w-3" /> وظيفة شاغرة
                </span>
                <h2 className="text-2xl font-bold text-card-foreground">{job.title}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-accent" /> {job.dept}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent" /> جمهورية مصر العربية</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-accent" /> دوام كامل</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 border-t border-border/40 pt-6">
              <h3 className="text-md font-bold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" /> تفاصيل وشروط الوظيفة:
              </h3>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed rtl:prose-invert font-sans" dangerouslySetInnerHTML={{ __html: job.description || "<p>لم يتم إضافة وصف وظيفي.</p>" }} />
            </div>
          </div>
        </Card>

        {/* Application Form */}
        <Card className="shadow-xl p-6 sm:p-8 border border-border/40 backdrop-blur-md bg-card/85 rounded-2xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
            <div className="p-2 bg-accent/10 rounded-lg text-accent"><FileText className="h-5 w-5" /></div>
            <div>
              <h3 className="text-xl font-bold">نموذج التقديم</h3>
              <p className="text-xs text-muted-foreground">يرجى تعبئة كافة الحقول بدقة وإرفاق ملف السيرة الذاتية الخاص بك</p>
            </div>
          </div>

          <form onSubmit={submitApp} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-accent" /> الاسم الكامل</Label>
                <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="أحمد محمد علي" className="h-11" />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-accent" /> البريد الإلكتروني</Label>
                <Input id="email" type="email" required dir="ltr" className="text-right h-11" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-accent" /> رقم الهاتف</Label>
                <Input id="phone" type="tel" required dir="ltr" className="text-right h-11" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0100 000 0000" />
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-xs font-bold flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-accent" /> تاريخ الميلاد</Label>
                <Input id="birthDate" type="date" required dir="ltr" className="text-right h-11" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
              </div>

              {/* Educational Qualification */}
              <div className="space-y-2">
                <Label htmlFor="qualification" className="text-xs font-bold flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-accent" /> المؤهل التعليمي</Label>
                <Input id="qualification" required value={qualification} onChange={e => setQualification(e.target.value)} placeholder="بكالوريوس هندسة حاسبات / تجارة / إلخ" className="h-11" />
              </div>

              {/* Military Status */}
              <div className="space-y-2">
                <Label htmlFor="militaryStatus" className="text-xs font-bold flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-accent" /> موقف التجنيد</Label>
                <Select value={militaryStatus} onValueChange={setMilitaryStatus} required>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر الموقف التجنيدي" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="مؤدي الخدمة العسكرية">مؤدي الخدمة العسكرية</SelectItem>
                    <SelectItem value="تأجيل">تأجيل</SelectItem>
                    <SelectItem value="معافى نهائي">معافى نهائي</SelectItem>
                    <SelectItem value="غير مطلوب للتجنيد">غير مطلوب للتجنيد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Previous Experience */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="experience" className="text-xs font-bold flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-accent" /> الخبرات السابقة</Label>
                <Textarea id="experience" required rows={4} value={experience} onChange={e => setExperience(e.target.value)} placeholder="اكتب نبذة عن وظائفك السابقة، المسؤوليات التي توليتها، وعدد سنوات الخبرة..." className="resize-none leading-relaxed" />
              </div>

              {/* CV File Upload */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cv" className="text-xs font-bold flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-accent" /> السيرة الذاتية (PDF, DOCX) - اختياري</Label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-muted/30 transition-all cursor-pointer ${file ? 'border-accent bg-accent/5' : 'border-border'}`}
                  onClick={() => document.getElementById('cv')?.click()}
                >
                  {file ? (
                    <>
                      <FileText className="h-12 w-12 text-accent animate-bounce" />
                      <span className="text-sm font-semibold text-accent">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / (1024 * 1024)).toFixed(2)} MB) - انقر لتغيير الملف</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground opacity-60" />
                      <span className="text-sm font-semibold">اضغط لاختيار ورفع ملف السيرة الذاتية</span>
                      <span className="text-xs text-muted-foreground">الصيغ المدعومة: PDF, DOCX (الحجم الأقصى: 10 ميجا بايت)</span>
                    </>
                  )}
                  <input id="cv" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-border/40">
              <Button type="submit" className="w-full sm:w-auto h-12 px-8 text-base bg-primary hover:bg-primary/95 text-primary-foreground shadow-md active:scale-95 transition-all duration-200" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري إرسال طلبك...
                  </>
                ) : (
                  "إرسال طلب التقديم"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
