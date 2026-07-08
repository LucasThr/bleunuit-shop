import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { memoizeTtl } from "./ttl-cache";

describe("memoizeTtl", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the underlying fn once within the TTL window", async () => {
    const fn = vi.fn(async () => "v");
    const cached = memoizeTtl(fn, 1000);

    await cached();
    vi.advanceTimersByTime(500);
    await cached();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("re-invokes after the TTL expires", async () => {
    const fn = vi.fn(async () => "v");
    const cached = memoizeTtl(fn, 1000);

    await cached();
    vi.advanceTimersByTime(1000);
    await cached();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent calls into a single invocation", async () => {
    const fn = vi.fn(
      () => new Promise<string>((resolve) => setTimeout(() => resolve("v"), 100))
    );
    const cached = memoizeTtl(fn, 1000);

    const p1 = cached();
    const p2 = cached();
    vi.advanceTimersByTime(100);
    await Promise.all([p1, p2]);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not cache a rejected promise", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok");
    const cached = memoizeTtl(fn, 1000);

    await expect(cached()).rejects.toThrow("boom");
    await expect(cached()).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
