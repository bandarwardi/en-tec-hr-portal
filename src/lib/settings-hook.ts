import { useEffect, useState } from "react";
import { getDocOnce } from "./use-collection";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export interface AppSettings {
  companyName: string;
  taxNumber: string;
  address: string;
  currency: string;
  payDay: number;
  insuranceRate: number;
  taxRate: number;
  workStart: string;
  workEnd: string;
  lateMinutes: number;
  workDays: string;
  // Late deduction
  lateDeductionPerMinute: number;
  // Absence
  absenceDeductionPerDay: number;
  // Unpaid leave (per day) — if 0, falls back to salary/30
  unpaidLeavePerDay: number;
  // Permission deduction per minute
  permissionDeductionPerMinute: number;
  // Standard working days per month
  workingDaysPerMonth: number;
}

export const defaultSettings: AppSettings = {
  companyName: "EN TEC",
  taxNumber: "",
  address: "القاهرة، مصر",
  currency: "ج.م",
  payDay: 25,
  insuranceRate: 11,
  taxRate: 10,
  workStart: "09:00",
  workEnd: "17:00",
  lateMinutes: 10,
  workDays: "الأحد - الخميس",
  lateDeductionPerMinute: 2,
  absenceDeductionPerDay: 0,
  unpaidLeavePerDay: 0,
  permissionDeductionPerMinute: 1,
  workingDaysPerMonth: 26,
};

export function useSettings(): { settings: AppSettings; loading: boolean } {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ref = doc(db, "settings_doc", "general");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings({ ...defaultSettings, ...(snap.data() as any) });
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);
  return { settings, loading };
}

export async function loadSettings(): Promise<AppSettings> {
  const d = await getDocOnce("settings_doc", "general");
  return { ...defaultSettings, ...((d as any) || {}) };
}