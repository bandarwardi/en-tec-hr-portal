import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("app_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("app_user");
      }
    }
    setLoading(false);
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    configured: true,
    login: async (email, password) => {
      // Seed default admin if database is empty
      const collRef = collection(db, "app_users");
      const allUsersSnap = await getDocs(collRef);
      if (allUsersSnap.empty) {
        const defaultAdmin = {
          name: "مدير النظام",
          email: "admin@entec.com",
          password: "admin",
          role: "مدير النظام",
          status: "نشط",
        };
        await addDoc(collRef, defaultAdmin);
      }

      // Query user in Firestore
      const q = query(
        collection(db, "app_users"),
        where("email", "==", email.trim().toLowerCase()),
        where("password", "==", password)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }

      const docObj = snap.docs[0];
      const data = docObj.data();
      if (data.status !== "نشط") {
        throw new Error("هذا الحساب موقوف");
      }

      const loggedUser: AppUser = {
        uid: docObj.id,
        email: data.email,
        displayName: data.name,
        role: data.role,
      };

      setUser(loggedUser);
      localStorage.setItem("app_user", JSON.stringify(loggedUser));
    },
    register: async () => {
      throw new Error("يرجى إنشاء مستخدم من لوحة التحكم");
    },
    logout: async () => {
      setUser(null);
      localStorage.removeItem("app_user");
    },
    resetPassword: async () => {
      throw new Error("الرجاء التواصل مع مدير النظام لإعادة تعيين كلمة المرور");
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
