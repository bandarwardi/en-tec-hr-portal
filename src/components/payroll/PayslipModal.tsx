import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { formatEGP } from "@/lib/currency";
import logoUrl from "@/assets/imgs/logo.jpeg";

export interface SlipData {
  id?: string;
  month: string;
  employeeId: string;
  employeeName: string;
  base: number;
  allow: number;
  deduct: number;
  net: number;
  status: string;
  breakdown?: string;
}

export function parseBreakdown(text: string) {
  const result = {
    insuranceAndTax: 0,
    lateMinutes: 0,
    lateDeduction: 0,
    absenceDays: 0,
    absenceDeduction: 0,
    unpaidDays: 0,
    unpaidDeduction: 0,
    permissionMinutes: 0,
    permissionDeduction: 0,
    customAllowance: 0,
    customAllowanceReasons: "",
    customDeduction: 0,
    customDeductionReasons: "",
  };
  if (!text) return result;

  const insMatch = text.match(/تأمينات وضرائب:\s*(\d+)/);
  if (insMatch) result.insuranceAndTax = Number(insMatch[1]);

  const lateMatch = text.match(/تأخير:\s*(\d+)د\s*\((\d+)\)/);
  if (lateMatch) {
    result.lateMinutes = Number(lateMatch[1]);
    result.lateDeduction = Number(lateMatch[2]);
  }

  const absMatch = text.match(/غياب:\s*(\d+)ي\s*\((\d+)\)/);
  if (absMatch) {
    result.absenceDays = Number(absMatch[1]);
    result.absenceDeduction = Number(absMatch[2]);
  }

  const unpaidMatch = text.match(/بدون راتب:\s*(\d+)ي\s*\((\d+)\)/);
  if (unpaidMatch) {
    result.unpaidDays = Number(unpaidMatch[1]);
    result.unpaidDeduction = Number(unpaidMatch[2]);
  }

  const permMatch = text.match(/أذونات:\s*(\d+)د\s*\((\d+)\)/);
  if (permMatch) {
    result.permissionMinutes = Number(permMatch[1]);
    result.permissionDeduction = Number(permMatch[2]);
  }

  const customAllowMatch = text.match(/علاوات إضافية:\s*(\d+)(?:\s*\((.*?)\))?/);
  if (customAllowMatch) {
    result.customAllowance = Number(customAllowMatch[1]);
    result.customAllowanceReasons = customAllowMatch[2] || "";
  }

  const customDeductMatch = text.match(/خصومات إضافية:\s*(\d+)(?:\s*\((.*?)\))?/);
  if (customDeductMatch) {
    result.customDeduction = Number(customDeductMatch[1]);
    result.customDeductionReasons = customDeductMatch[2] || "";
  }

  return result;
}

export function PayslipModal({ 
  open, 
  setOpen, 
  slip, 
  employee 
}: { 
  open: boolean; 
  setOpen: (open: boolean) => void; 
  slip: SlipData | null;
  employee?: { code?: string; role?: string; dept?: string; };
}) {
  if (!slip) return null;

  const details = parseBreakdown(slip.breakdown || "");
  
  const handlePrint = () => {
    window.open(`/payroll-print/${slip.id}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl print:max-w-none print:w-full print:border-none print:shadow-none p-0 overflow-hidden">
        {/* Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            [role="dialog"], [role="dialog"] * {
              visibility: visible;
            }
            [role="dialog"] {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              box-shadow: none;
            }
            .print-hidden {
              display: none !important;
            }
          }
        `}</style>
        
        <div className="p-6">
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
                {slip.allow - details.customAllowance > 0 && (
                  <TableRow>
                    <TableCell className="font-medium">البدلات والمكافآت الأساسية</TableCell>
                    <TableCell className="text-success">{formatEGP(slip.allow - details.customAllowance)}</TableCell>
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
                
                {/* Deductions */}
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">تأمينات وضرائب</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-destructive">{formatEGP(details.insuranceAndTax)}</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">
                    غياب <span className="text-xs">({details.absenceDays} أيام)</span>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-destructive">{formatEGP(details.absenceDeduction)}</TableCell>
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
                    إجازات بدون راتب <span className="text-xs">({details.unpaidDays} أيام)</span>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-destructive">{formatEGP(details.unpaidDeduction)}</TableCell>
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

        {/* Action Buttons (Hidden in print) */}
        <div className="p-4 bg-muted/30 border-t flex justify-end gap-3 print-hidden">
          <Button variant="outline" onClick={() => setOpen(false)}>إغلاق</Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <Printer className="ml-2 h-4 w-4" />
            طباعة الكشف
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
