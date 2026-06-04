import type { AppSettings } from "./settings-hook";

export interface AttRec {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
}

export interface LeaveRec {
  employeeId: string;
  type: string; // سنوية / مرضية / بدون راتب / إذن ...
  from: string;
  to: string;
  days?: number;
  status: string; // موافق عليها / بانتظار / مرفوضة
  unpaid?: boolean;
  deductionAmount?: number; // override
  // For permissions
  startTime?: string;
  endTime?: string;
  isPermission?: boolean;
}

/** Calculates late minutes supporting midnight crossing shifts (workStart > workEnd). */
export function getLateMinutes(workStart: string, workEnd: string, checkIn: string): number {
  if (!workStart || !checkIn) return 0;
  const [sh, sm] = workStart.split(":").map(Number);
  const [eh, em] = (workEnd || "17:00").split(":").map(Number);
  const [ch, cm] = checkIn.split(":").map(Number);
  if ([sh, sm, eh, em, ch, cm].some(Number.isNaN)) return 0;

  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const checkMins = ch * 60 + cm;

  // Case 1: Midnight crossing (e.g. 22:00 to 07:00)
  if (startMins > endMins) {
    if (checkMins >= startMins) {
      return checkMins - startMins;
    }
    if (checkMins <= endMins) {
      return (1440 - startMins) + checkMins;
    }
    return 0;
  }

  // Case 2: Normal shift (e.g. 09:00 to 17:00)
  if (checkMins > startMins) {
    return checkMins - startMins;
  }
  return 0;
}

/** Minutes between two HH:MM strings (b - a). Returns 0 if invalid or negative. */
export function minutesBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  if ([ah, am, bh, bm].some(Number.isNaN)) return 0;
  const diff = bh * 60 + bm - (ah * 60 + am);
  return diff > 0 ? diff : 0;
}


function inMonth(date: string, month: string): boolean {
  return date?.slice(0, 7) === month;
}

function workingDaysInMonth(month: string, workingDays: number[]): number {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  let n = 0;
  for (let d = 1; d <= days; d++) {
    const wd = new Date(y, m - 1, d).getDay(); // 0 sun..6 sat
    if (workingDays.includes(wd)) n++;
  }
  return n;
}

export interface EmployeeMonthDeductions {
  lateMinutes: number;
  lateDeduction: number;
  absenceDays: number;
  absenceDeduction: number;
  unpaidDays: number;
  unpaidDeduction: number;
  permissionMinutes: number;
  permissionDeduction: number;
  total: number;
  breakdown: string;
}

export function calcEmployeeDeductions(opts: {
  employeeId: string;
  baseSalary: number;
  month: string; // YYYY-MM
  attendance: AttRec[];
  leaves: LeaveRec[];
  settings: AppSettings;
}): EmployeeMonthDeductions {
  const { employeeId, baseSalary, month, attendance, leaves, settings } = opts;
  const workingDays = settings.workingDays || [0, 1, 2, 3, 4];

  // --- Approved leaves (this month) ---
  const approved = leaves.filter(
    (l) => l.employeeId === employeeId && l.status === "موافق عليها",
  );

  const leaveDaysSet = new Set<string>();
  for (const l of approved) {
    if (l.isPermission) continue;
    const ds = expandDates(l.from, l.to).filter((d) => inMonth(d, month));
    ds.forEach((d) => leaveDaysSet.add(d));
  }

  // --- Late ---
  const empAtt = attendance.filter((a) => a.employeeId === employeeId && inMonth(a.date, month));
  let lateMinutes = 0;
  let lateDeduction = 0;
  for (const a of empAtt) {
    if (!a.checkIn) continue;
    
    // Skip late calculation if day is fully covered by an approved leave
    if (leaveDaysSet.has(a.date)) continue;
    
    let effectiveStart = settings.workStart;
    const perm = approved.find(l => l.isPermission && l.from === a.date);
    if (perm && perm.startTime && perm.endTime) {
      if (perm.startTime <= settings.workStart) {
        effectiveStart = perm.endTime;
      }
    }
    
    const late = getLateMinutes(effectiveStart, settings.workEnd, a.checkIn);
    if (late > 0) {
      lateMinutes += late;
      if (late < 15) {
        // Less than 15 minutes: no deduction
      } else if (late >= 15 && late <= 60) {
        // 15 to 60 minutes: 0.5 day deduction
        lateDeduction += (baseSalary / 30) * 0.5;
      } else {
        // More than 60 minutes: 1 day deduction
        lateDeduction += (baseSalary / 30) * 1.0;
      }
    }
  }
  lateDeduction = Math.round(lateDeduction);

  // Per-day rate for unpaid leave & absence
  const dayRate = settings.unpaidLeavePerDay && settings.unpaidLeavePerDay > 0
    ? settings.unpaidLeavePerDay
    : baseSalary / (settings.workingDaysPerMonth || 26);

  // --- Unpaid leave deduction ---
  let unpaidDays = 0;
  let unpaidDeduction = 0;
  for (const l of approved) {
    if (l.isPermission) continue;
    if (!(l.unpaid || l.type === "بدون راتب")) continue;
    // only count days that fall in this month
    const d = daysOverlappingMonth(l.from, l.to, month);
    if (d <= 0) continue;
    unpaidDays += d;
    if (typeof l.deductionAmount === "number" && l.deductionAmount > 0) {
      unpaidDeduction += l.deductionAmount;
    } else {
      unpaidDeduction += Math.round(d * dayRate);
    }
  }

  // --- Permission deduction ---
  let permissionMinutes = 0;
  let permissionDeduction = 0;
  for (const l of approved) {
    if (!l.isPermission) continue;
    if (!inMonth(l.from, month)) continue;
    const mins = minutesBetween(l.startTime || "", l.endTime || "");
    permissionMinutes += mins;
    if (typeof l.deductionAmount === "number" && l.deductionAmount > 0) {
      permissionDeduction += l.deductionAmount;
    } else {
      permissionDeduction += Math.round(mins * (settings.permissionDeductionPerMinute || 0));
    }
  }

  // --- Absence: working days in month minus attended minus approved leave days ---
  const totalWorking = workingDaysInMonth(month, workingDays);
  const attendedDates = new Set(empAtt.map((a) => a.date));
  const consideredDays = new Set<string>([...attendedDates, ...leaveDaysSet]);
  // Count working days in month that are not covered
  const [y, mm] = month.split("-").map(Number);
  const today = new Date();
  let absenceDays = 0;
  const endDay = (today.getFullYear() === y && today.getMonth() + 1 === mm)
    ? today.getDate()
    : new Date(y, mm, 0).getDate();
  for (let d = 1; d <= endDay; d++) {
    const date = new Date(y, mm - 1, d);
    const wd = date.getDay();
    if (!workingDays.includes(wd)) continue;
    const key = `${y}-${String(mm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!consideredDays.has(key)) absenceDays++;
  }
  void totalWorking;
  const absencePerDay = settings.absenceDeductionPerDay && settings.absenceDeductionPerDay > 0
    ? settings.absenceDeductionPerDay
    : baseSalary / 26;
  const absenceDeduction = Math.round(absenceDays * absencePerDay);

  const total = lateDeduction + absenceDeduction + unpaidDeduction + permissionDeduction;
  const breakdown = `تأخير: ${lateMinutes}د (${lateDeduction}) — غياب: ${absenceDays}ي (${absenceDeduction}) — بدون راتب: ${unpaidDays}ي (${unpaidDeduction}) — أذونات: ${permissionMinutes}د (${permissionDeduction})`;

  return {
    lateMinutes,
    lateDeduction,
    absenceDays,
    absenceDeduction,
    unpaidDays,
    unpaidDeduction,
    permissionMinutes,
    permissionDeduction,
    total,
    breakdown,
  };
}

function expandDates(from: string, to: string): string[] {
  if (!from || !to) return [];
  const out: string[] = [];
  const start = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  if (isNaN(+start) || isNaN(+end)) return [];
  const d = new Date(start);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function daysOverlappingMonth(from: string, to: string, month: string): number {
  return expandDates(from, to).filter((d) => inMonth(d, month)).length;
}