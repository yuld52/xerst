import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const Page = lazy(() => import("@/features/lomustrack/advanced-settings"));

export const Route = createFileRoute("/_dashboard/settings")({
  component: Page,
});
