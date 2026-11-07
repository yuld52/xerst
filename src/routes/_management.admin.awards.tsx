import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Page = lazy(() => import("@/features/lomustrack/admin-awards"));
export const Route = createFileRoute("/_management/admin/awards")({ component: Screen });
function Screen() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Carregando...</div>}>
      <Page />
    </Suspense>
  );
}
