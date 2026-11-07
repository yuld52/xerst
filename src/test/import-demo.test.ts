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
  it("does not claim that a demonstration campaign was published", async () => {
    await expect(publishCampaign({}, [])).rejects.toThrow("Publicação indisponível");
  });
});
