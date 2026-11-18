import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/services/api";
import { publishCampaign } from "@/services/campaignCreator";

describe("Isolated repository demonstration", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("mock_mode", "true");
  });
  it("never calls a live API for unsupported demonstration reads", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(apiRequest("/unsupported")).rejects.toThrow("demonstração");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  it("returns a simulated AI chat response without calling the live API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await apiRequest<{ response: string }>("/gemini/chat", {
      method: "POST",
      body: { message: "Como está o ROAS?" },
    });

    expect(result.response).toContain("Análise de ROAS");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  it("returns a simulated daily AI report without calling the live API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await apiRequest<{ spend_today: number; response: string }>(
      "/gemini/daily-report",
      { method: "POST", body: {} },
    );

    expect(result.spend_today).toBeGreaterThan(0);
    expect(result.response).toContain("Relatório Diário");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  it("does not claim that a demonstration campaign was published", async () => {
    await expect(publishCampaign({}, [])).rejects.toThrow("Publicação indisponível");
  });
});
