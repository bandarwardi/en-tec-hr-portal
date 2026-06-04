import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getDocOnce } from "@/lib/use-collection";
import { formatEGP } from "@/lib/currency";
import { parseBreakdown } from "@/components/payroll/PayslipModal";
import logoUrl from "@/assets/imgs/logo.jpeg";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/payroll-print/$id")({
  component: PayrollPrintPage,
});

function PayrollPrintPage() {
  const { id } = Route.useParams();
  const [slip, setSlip] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const slipData = (await getDocOnce("payroll", id)) as any;
        if (slipData) {
          setSlip(slipData);
          const empData = await getDocOnce("employees", slipData.employeeId);
          if (empData) {
            setEmployee(empData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!loading && slip) {
      // Auto trigger print after rendering is complete
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [loading, slip]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-lg">جاري تحميل بيانات الكشف...</p>
      </div>
    );
  }

  if (!slip) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-destructive text-lg font-semibold">لم يتم العثور على الكشف المطلوب.</p>
      </div>
    );
  }

  const details = parseBreakdown(slip.breakdown || "");
  const baseAllow = slip.allow - details.customAllowance - (slip.salesBonus || 0) - (slip.salesTarget || 0);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center">
      {/* Action Buttons (Hidden in print) */}
      <div className="w-full max-w-3xl mb-6 flex justify-end gap-3 print:hidden">
        <Button variant="outline" onClick={() => window.close()}>
          <X className="ml-2 h-4 w-4" />
          إغلاق النافذة
        </Button>
        <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90">
          <Printer className="ml-2 h-4 w-4" />
          طباعة الكشف
        </Button>
      </div>

      <div className="w-full max-w-3xl bg-card text-card-foreground border rounded-xl shadow-sm p-6 sm:p-10 print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-6">
          <div className="flex items-center gap-4">
            <img src={logoUrl} alt="EN TEC" className="h-16 w-16 rounded-md object-cover" />
            <div>
              <h2 className="text-2xl font-bold text-primary">EN TEC</h2>
              <p className="text-muted-foreground text-sm">شركة إن تك</p>
            </div>
          </div>
          <div className="text-left" dir="ltr">
            <h2 className="text-xl font-semibold text-foreground">Payslip / مفردات مرتب</h2>
            <p className="text-muted-foreground mt-1">Month: {slip.month}</p>
          </div>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-4 my-6 bg-muted/30 p-4 rounded-lg border">
          <div>
            <p className="text-sm text-muted-foreground">اسم الموظف</p>
            <p className="font-semibold text-base">{slip.employeeName}</p>
          </div>
          {employee?.code && (
            <div>
              <p className="text-sm text-muted-foreground">الرقم الوظيفي</p>
              <p className="font-medium">{employee.code}</p>
            </div>
          )}
          {employee?.dept && (
            <div>
              <p className="text-sm text-muted-foreground">القسم</p>
              <p className="font-medium">{employee.dept}</p>
            </div>
          )}
          {employee?.role && (
            <div>
              <p className="text-sm text-muted-foreground">المسمى الوظيفي</p>
              <p className="font-medium">{employee.role}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">حالة الدفع</p>
            <Badge variant="outline" className={slip.status === "مدفوع" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
              {slip.status}
            </Badge>
          </div>
        </div>

        {/* Statement Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-1/2 text-right">البند / Item</TableHead>
                <TableHead className="w-1/4 text-right">مستحقات (Earnings)</TableHead>
                <TableHead className="w-1/4 text-right">استقطاعات (Deductions)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Earnings */}
              <TableRow>
                <TableCell className="font-medium">الراتب الأساسي</TableCell>
                <TableCell className="text-success">{formatEGP(slip.base)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
              {baseAllow > 0 && (
                <TableRow>
                  <TableCell className="font-medium">البدلات والمكافآت الأساسية</TableCell>
                  <TableCell className="text-success">{formatEGP(baseAllow)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
              {details.customAllowance > 0 && (
                <TableRow>
                  <TableCell className="font-medium">
                    علاوات إضافية <span className="text-xs text-muted-foreground">({details.customAllowanceReasons})</span>
                  </TableCell>
                  <TableCell className="text-success">{formatEGP(details.customAllowance)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
              {slip.salesBonus > 0 && (
                <TableRow>
                  <TableCell className="font-medium">
                    بونص المبيعات <span className="text-xs text-muted-foreground">(مبيعات: {slip.salesUSD}$)</span>
                  </TableCell>
                  <TableCell className="text-success">{formatEGP(slip.salesBonus)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
              {slip.salesTarget > 0 && (
                <TableRow>
                  <TableCell className="font-medium">
                    عمولة تحقيق التارجت <span className="text-xs text-muted-foreground">(مبيعات: {slip.salesUSD}$ × 2.5)</span>
                  </TableCell>
                  <TableCell className="text-success">{formatEGP(slip.salesTarget)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
              
              {/* Deductions */}
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">تأمينات وضرائب</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-destructive">{formatEGP(details.insuranceAndTax)}</TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">
                  غياب وبدون راتب <span className="text-xs">({details.absenceDays + details.unpaidDays} أيام)</span>
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-destructive">{formatEGP(details.absenceDeduction + details.unpaidDeduction)}</TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">
                  تأخير <span className="text-xs">({details.lateMinutes} دقيقة)</span>
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-destructive">{formatEGP(details.lateDeduction)}</TableCell>
              </TableRow>
              
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">
                  أذونات <span className="text-xs">({details.permissionMinutes} دقيقة)</span>
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-destructive">{formatEGP(details.permissionDeduction)}</TableCell>
              </TableRow>

              {details.customDeduction > 0 && (
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">
                    خصومات إضافية <span className="text-xs text-muted-foreground">({details.customDeductionReasons})</span>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-destructive">{formatEGP(details.customDeduction)}</TableCell>
                </TableRow>
              )}

              {/* Totals */}
              <TableRow className="bg-muted/20">
                <TableCell className="font-bold">الإجمالي</TableCell>
                <TableCell className="font-bold text-success">{formatEGP(slip.base + slip.allow)}</TableCell>
                <TableCell className="font-bold text-destructive">{formatEGP(slip.deduct)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Net Salary Highlight */}
        <div className="mt-6 bg-accent/10 border border-accent/20 p-6 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-accent-foreground">صافي الراتب (Net Salary)</h3>
            <p className="text-sm text-accent-foreground/80 mt-1">ما يستحقه الموظف لهذا الشهر</p>
          </div>
          <div className="text-3xl font-black text-accent-foreground tracking-tight">
            {formatEGP(slip.net)}
          </div>
        </div>
      </div>
    </div>
  );
}
