import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — LomusTrack" },
      { name: "description", content: "Administração do portal LomusTrack." },
      { property: "og:title", content: "Administração — LomusTrack" },
      { property: "og:description", content: "Administração do portal LomusTrack." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
});
