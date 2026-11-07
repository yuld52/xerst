import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Page = lazy(() => import("@/features/lomustrack/admin-billing"));

export const Route = createFileRoute("/_management/admin/subscriptions")({ component: Screen });

function Screen() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Carregando...</div>}>
      <Page />
    </Suspense>
  );
}
