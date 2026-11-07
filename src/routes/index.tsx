import { createFileRoute, redirect } from "@tanstack/react-router";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LomusTrack — Gestão e Métricas" },
      {
        name: "description",
        content: "Portal LomusTrack para gestão de vendas, campanhas e métricas.",
      },
      { property: "og:title", content: "LomusTrack — Gestão e Métricas" },
      { property: "og:description", content: "Gestão de vendas, campanhas e métricas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
