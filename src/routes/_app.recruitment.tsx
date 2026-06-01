import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Briefcase, Users, Plus, Pencil, Trash2, Link as LinkIcon, 
  Eye, FileText, Calendar, MapPin, ExternalLink, Search, CheckCircle2, XCircle, Clock, Loader2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCollection, addItem, updateItem, deleteItem } from "@/lib/use-collection";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/RichTextEditor";

export const Route = createFileRoute("/_app/recruitment")({
  component: RecruitmentPage,
});

interface Job { id?: string; title: string; dept: string; applicants: number; status: string; description: string; }
const emptyJob: Job = { title: "", dept: "", applicants: 0, status: "مفتوحة", description: "" };

interface Applicant {
  id?: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  qualification: string;
  militaryStatus: string;
  experience: string;
  cvUrl: string;
  applicationNumber: string;
  status: string;
  date: string;
  interviewLocation?: string;
  interviewMapLink?: string;
  interviewDateTime?: string;
}

function RecruitmentPage() {
  const { data: jobs, loading: loadingJobs } = useCollection<Job>("jobs");
  const { data: applicants, loading: loadingApps } = useCollection<Applicant>("applicants");
  const { data: depts } = useCollection<{ name: string }>("departments");
  
  const [activeTab, setActiveTab] = useState("jobs");
  
  // Jobs states
  const [openJobDialog, setOpenJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<{ id?: string; data: Job }>({ data: emptyJob });
  
  // Applicants states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [openAppDialog, setOpenAppDialog] = useState(false);
  
  // Edit application status states
  const [editStatus, setEditStatus] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewMapLink, setInterviewMapLink] = useState("");
  const [interviewDateTime, setInterviewDateTime] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Job Handlers
  const saveJob = async () => {
    if (!editingJob.data.title) return toast.error("اسم الوظيفة مطلوب");
    if (editingJob.id) await updateItem("jobs", editingJob.id, editingJob.data);
    else await addItem("jobs", editingJob.data);
    toast.success("تم الحفظ بنجاح");
    setOpenJobDialog(false);
    setEditingJob({ data: emptyJob });
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/jobs/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط", { description: url });
  };

  // Applicant Handlers
  const openApplicantDetails = (app: Applicant) => {
    setSelectedApplicant(app);
    setEditStatus(app.status);
    setInterviewLocation(app.interviewLocation || "");
    setInterviewMapLink(app.interviewMapLink || "");
    setInterviewDateTime(app.interviewDateTime || "");
    setOpenAppDialog(true);
  };

  const saveApplicantStatus = async () => {
    if (!selectedApplicant || !selectedApplicant.id) return;
    
    if (editStatus === "مقابلة" && (!interviewLocation.trim() || !interviewMapLink.trim() || !interviewDateTime.trim())) {
      return toast.error("يرجى إدخال تفاصيل ومكان المقابلة ورابط الخرائط والتوقيت");
    }
    
    setSavingStatus(true);
    try {
      const updateData: Partial<Applicant> = {
        status: editStatus,
        interviewLocation: editStatus === "مقابلة" ? interviewLocation : "",
        interviewMapLink: editStatus === "مقابلة" ? interviewMapLink : "",
        interviewDateTime: editStatus === "مقابلة" ? interviewDateTime : ""
      };
      
      await updateItem("applicants", selectedApplicant.id, updateData);
      toast.success("تم تحديث حالة الطلب بنجاح");
      setOpenAppDialog(false);
      setSelectedApplicant(null);
    } catch (err: any) {
      toast.error("فشل التحديث", { description: err.message });
    } finally {
      setSavingStatus(false);
    }
  };

  const removeApplicant = async (app: Applicant) => {
    if (!app.id) return;
    if (window.confirm(`هل أنت متأكد من حذف طلب المتقدم "${app.name}"؟`)) {
      try {
        await deleteItem("applicants", app.id);
        
        // Decrement applicant count on the job
        const jobOfApp = jobs.find(j => j.id === app.jobId);
        if (jobOfApp && jobOfApp.id) {
          await updateItem("jobs", jobOfApp.id, {
            applicants: Math.max(0, (jobOfApp.applicants || 1) - 1)
          });
        }
        
        toast.success("تم حذف الطلب بنجاح");
      } catch (err: any) {
        toast.error("فشل حذف الطلب", { description: err.message });
      }
    }
  };

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const matchesSearch = 
        !searchQuery ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [applicants, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    if (status === "جديد") return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">جديد</Badge>;
    if (status === "مقابلة") return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">مقابلة شخصية</Badge>;
    if (status === "مقبول") return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">مقبول</Badge>;
    if (status === "توظيف") return <Badge variant="outline" className="bg-success/15 text-success border-success/20">تم التوظيف</Badge>;
    return <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/20">مرفوض</Badge>;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="بوابة التوظيف"
        subtitle="إدارة الوظائف المعلنة، ومراجعة طلبات المتقدمين وتحديد المقابلات الشخصية"
        actions={
          activeTab === "jobs" && (
            <Dialog open={openJobDialog} onOpenChange={(o) => { setOpenJobDialog(o); if (!o) setEditingJob({ data: emptyJob }); }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingJob({ data: emptyJob })}><Plus className="ml-2 h-4 w-4" />وظيفة جديدة</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader><DialogTitle>{editingJob.id ? "تعديل وظيفة" : "وظيفة جديدة"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2"><Label>المسمى الوظيفي</Label><Input value={editingJob.data.title} onChange={(e) => setEditingJob((s) => ({ ...s, data: { ...s.data, title: e.target.value } }))} /></div>
                  <div className="space-y-1.5">
                    <Label>القسم</Label>
                    <Select value={editingJob.data.dept} onValueChange={(v) => setEditingJob((s) => ({ ...s, data: { ...s.data, dept: v } }))}>
                      <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      <SelectContent>{depts.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>الحالة</Label>
                    <Select value={editingJob.data.status} onValueChange={(v) => setEditingJob((s) => ({ ...s, data: { ...s.data, status: v } }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["مفتوحة", "مقابلات", "مغلقة"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5 sm:col-span-2 mt-4">
                    <Label>الوصف الوظيفي والشروط</Label>
                    <div className="border rounded-md overflow-hidden bg-background">
                      <RichTextEditor 
                        value={editingJob.data.description || ""} 
                        onChange={(content) => setEditingJob((s) => ({ ...s, data: { ...s.data, description: content } }))} 
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setOpenJobDialog(false)}>إلغاء</Button>
                  <Button onClick={saveJob}>حفظ الوظيفة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>الوظائف الشاغرة ({jobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="applicants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>طلبات التقديم ({applicants.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Available Jobs */}
        <TabsContent value="jobs" className="space-y-4">
          {loadingJobs && <p className="text-muted-foreground animate-pulse">جاري تحميل الوظائف...</p>}
          {!loadingJobs && jobs.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p>لا توجد وظائف معلنة حالياً. أضف وظيفة جديدة للبدء.</p>
            </Card>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {jobs.map((j) => (
              <Card key={j.id} className="p-5 transition-all hover:shadow-lg flex flex-col h-full border border-border/60">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Briefcase className="h-5 w-5" /></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => copyLink(j.id!)} title="نسخ رابط التقديم"><LinkIcon className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingJob({ id: j.id, data: j as Job }); setOpenJobDialog(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={async () => { if(window.confirm('هل أنت متأكد من حذف هذه الوظيفة؟')){ await deleteItem("jobs", j.id!); toast.success("تم الحذف بنجاح"); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <h3 className="text-base font-bold line-clamp-1">{j.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{j.dept || "—"}</p>
                
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /><span>{j.applicants || 0} متقدم</span></div>
                    <Badge variant="outline" className={j.status === "مفتوحة" ? "bg-success/15 text-success border-success/20" : j.status === "مقابلات" ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/15 text-destructive border-destructive/20"}>{j.status}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Job Applicants */}
        <TabsContent value="applicants" className="space-y-4">
          <Card className="p-4 border border-border/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              
              {/* Search input */}
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="ابحث بالاسم، الوظيفة، أو رقم الطلب..." 
                  className="pr-9 h-10" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
              </div>

              {/* Status filter select */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">تصفية حسب الحالة:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="جديد">جديد</SelectItem>
                    <SelectItem value="مقابلة">مقابلات</SelectItem>
                    <SelectItem value="مقبول">مقبول</SelectItem>
                    <SelectItem value="توظيف">تم التوظيف</SelectItem>
                    <SelectItem value="مرفوض">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </Card>

          {loadingApps && <p className="text-muted-foreground animate-pulse">جاري تحميل طلبات التوظيف...</p>}
          {!loadingApps && filteredApplicants.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground border-dashed">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p>لا توجد طلبات تقديم مطابقة للبحث حالياً.</p>
            </Card>
          )}

          {!loadingApps && filteredApplicants.length > 0 && (
            <Card className="overflow-hidden border border-border/60 shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الطلب</TableHead>
                      <TableHead className="text-right">المتقدم</TableHead>
                      <TableHead className="text-right">الوظيفة</TableHead>
                      <TableHead className="text-right">تاريخ التقديم</TableHead>
                      <TableHead className="text-right">المؤهل</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplicants.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-xs font-bold text-muted-foreground">{app.applicationNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold text-foreground">{app.name}</div>
                            <div className="text-xs text-muted-foreground">{app.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-accent-foreground">{app.jobTitle}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{app.date}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs" title={app.qualification}>{app.qualification}</TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 items-center justify-start">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-accent-foreground hover:text-accent-foreground/90"
                              onClick={() => openApplicantDetails(app)}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              <span>مراجعة</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10 h-8 w-8"
                              onClick={() => removeApplicant(app)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Review applicant Dialog */}
      <Dialog open={openAppDialog} onOpenChange={(o) => { setOpenAppDialog(o); if(!o) setSelectedApplicant(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          {selectedApplicant && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-lg text-accent-foreground"><Users className="h-5 w-5" /></div>
                  <div>
                    <DialogTitle>مراجعة طلب التوظيف: {selectedApplicant.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground">رقم تتبع الطلب: {selectedApplicant.applicationNumber} • مقدم في {selectedApplicant.date}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                
                {/* Details Section */}
                <Card className="p-4 space-y-3 border border-border/40 bg-muted/20">
                  <h4 className="font-bold text-sm border-b pb-1.5 flex items-center gap-2"><Users className="h-4 w-4 text-accent-foreground" /> البيانات الشخصية والتعليمية</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground font-medium">البريد الإلكتروني: </span><span dir="ltr" className="font-semibold">{selectedApplicant.email}</span></div>
                    <div><span className="text-muted-foreground font-medium">رقم الهاتف: </span><span dir="ltr" className="font-semibold">{selectedApplicant.phone}</span></div>
                    <div><span className="text-muted-foreground font-medium">تاريخ الميلاد: </span><span className="font-semibold">{selectedApplicant.birthDate}</span></div>
                    <div><span className="text-muted-foreground font-medium">الوظيفة المتقدم لها: </span><span className="font-bold text-accent-foreground">{selectedApplicant.jobTitle}</span></div>
                    <div><span className="text-muted-foreground font-medium">المؤهل الدراسي: </span><span className="font-semibold">{selectedApplicant.qualification}</span></div>
                    <div><span className="text-muted-foreground font-medium">الموقف من التجنيد: </span><span className="font-semibold">{selectedApplicant.militaryStatus}</span></div>
                  </div>
                </Card>

                {/* Experience section */}
                <Card className="p-4 space-y-3 border border-border/40 bg-muted/20">
                  <h4 className="font-bold text-sm border-b pb-1.5 flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent-foreground" /> الخبرات والملفات المرفقة</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">الخبرات السابقة المكتوبة:</span>
                      <p className="text-xs bg-background p-2.5 rounded-lg border leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">{selectedApplicant.experience}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">السيرة الذاتية المرفقة:</span>
                      {selectedApplicant.cvUrl ? (
                        <a href={selectedApplicant.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-accent-foreground hover:underline bg-background border px-3 py-2 rounded-lg shadow-sm w-full justify-center">
                          <FileText className="h-4 w-4" />
                          <span>فتح وتحميل السيرة الذاتية (CV)</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground block bg-background p-3 rounded-lg border text-center font-medium">لم يتم إرفاق سيرة ذاتية</span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Status and Action section */}
                <Card className="p-4 md:col-span-2 space-y-4 border border-border/40">
                  <h4 className="font-bold text-sm border-b pb-1.5 flex items-center gap-2"><Clock className="h-4 w-4 text-accent-foreground" /> اتخاذ قرار بشأن الطلب</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">الحالة الجديدة للطلب</Label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="جديد">جديد</SelectItem>
                          <SelectItem value="مقابلة">تحديد مقابلة شخصية</SelectItem>
                          <SelectItem value="مقبول">قبول الطلب</SelectItem>
                          <SelectItem value="توظيف">توظيف</SelectItem>
                          <SelectItem value="مرفوض">رفض الطلب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editStatus === "مقابلة" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">تاريخ ووقت المقابلة</Label>
                        <Input 
                          type="datetime-local" 
                          dir="ltr"
                          className="h-10 text-right"
                          value={interviewDateTime} 
                          onChange={(e) => setInterviewDateTime(e.target.value)} 
                        />
                      </div>
                    )}

                    {editStatus === "مقابلة" && (
                      <div className="space-y-1.5 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">مكان المقابلة (نصاً)</Label>
                          <Input 
                            placeholder="مثال: مقر الشركة بالمعادي - الدور الثالث" 
                            value={interviewLocation} 
                            onChange={(e) => setInterviewLocation(e.target.value)} 
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">رابط خرائط جوجل للموقع (Google Maps Link)</Label>
                          <Input 
                            placeholder="https://maps.app.goo.gl/..." 
                            dir="ltr"
                            value={interviewMapLink} 
                            onChange={(e) => setInterviewMapLink(e.target.value)} 
                            className="h-10 text-right"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

              </div>

              <DialogFooter className="border-t pt-4">
                <Button variant="outline" onClick={() => setOpenAppDialog(false)} disabled={savingStatus}>إلغاء</Button>
                <Button onClick={saveApplicantStatus} disabled={savingStatus}>
                  {savingStatus ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                  حفظ التعديلات
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
