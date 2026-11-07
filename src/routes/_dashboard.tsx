import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Layout = lazy(() =>
  import("@/components/layout/DashboardLayout").then((m) => ({ default: m.DashboardLayout })),
);
export const Route = createFileRoute("/_dashboard")({ component: ImportedLayout });
function ImportedLayout() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Carregando...</div>}>
      <Layout />
    </Suspense>
  );
}
