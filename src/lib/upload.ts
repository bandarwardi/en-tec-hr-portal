// رفع الملفات عبر API المخصص (entec.store)
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("https://entec.store/api/upload.php", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("فشل رفع الملف");
  const data = await res.json();
  return data.url as string;
}
