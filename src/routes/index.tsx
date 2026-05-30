import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EN TEC HR System" },
      { name: "description", content: "EN TEC HR System" },
      { property: "og:title", content: "EN TEC HR System" },
      { property: "og:description", content: "EN TEC HR System" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary to-background px-6">
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground text-center">
        EN TEC HR System
      </h1>
    </main>
  );
}
