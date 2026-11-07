import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/features/lomustrack/admin-operations"));

export const Route = createFileRoute("/_management/admin/operations")({ component: Page });
