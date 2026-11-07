import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Layout = lazy(() =>
  import("@/components/layout/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
export const Route = createFileRoute("/_management")({ component: ImportedLayout });
function ImportedLayout() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Carregando...</div>}>
      <Layout />
    </Suspense>
  );
}
