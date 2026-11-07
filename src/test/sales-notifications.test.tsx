import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const DEMO_FLAG = "sales_notifications_enabled";

describe("Sales notifications bell (demonstration mode)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    sessionStorage.setItem("mock_mode", "true");
  });

  it("activates sales notifications without any live API call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isSubscribed).toBe(false);

    let activated: boolean | undefined;
    await act(async () => {
      activated = await result.current.requestPermission();
    });

    expect(activated).toBe(true);
    expect(result.current.isSubscribed).toBe(true);
    expect(localStorage.getItem(DEMO_FLAG)).toBe("true");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("turns sales notifications off again", async () => {
    localStorage.setItem(DEMO_FLAG, "true");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isSubscribed).toBe(true);

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(localStorage.getItem(DEMO_FLAG)).toBe(null);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("sends a test sale alert locally, never to a live API", async () => {
    localStorage.setItem(DEMO_FLAG, "true");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.testNotification();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
