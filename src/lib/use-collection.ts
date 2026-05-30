import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  type QueryConstraint,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type WithId<T> = T & { id: string };

export function useCollection<T = any>(
  path: string,
  constraints: QueryConstraint[] = [],
  enabled = true,
) {
  const [data, setData] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, path), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled]);

  return { data, loading, error };
}

export async function addItem(path: string, data: Record<string, any>) {
  return await addDoc(collection(db, path), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateItem(path: string, id: string, data: Record<string, any>) {
  await updateDoc(doc(db, path, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteItem(path: string, id: string) {
  await deleteDoc(doc(db, path, id));
}

export async function setDocItem(path: string, id: string, data: Record<string, any>) {
  await setDoc(doc(db, path, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getDocOnce(path: string, id: string) {
  const s = await getDoc(doc(db, path, id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export { orderBy };
