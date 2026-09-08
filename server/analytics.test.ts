import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const allFilters = { timeRange: "all" as const, category: "all" };

describe("analytics procedures", () => {
  it("returns a complete overview from all 32,638 cleaned observations", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.analytics.overview(allFilters);

    expect(result.recordsTotal).toBe(32_638);
    expect(result.recordsUsed).toBe(32_638);
    expect(result.videosTrending).toBe(32_638);
    expect(result.totalViews).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.topChannels.length).toBeGreaterThan(0);
    expect(result.monthly.length).toBeGreaterThan(0);
    expect(result.availableCategories).toContain("Entertainment");
    expect(result.peakMonth?.month).toMatch(/^20\d\d-\d\d$/);
  });

  it("recalculates the overview when a category filter is applied", async () => {
    const caller = appRouter.createCaller(createContext());
    const all = await caller.analytics.overview(allFilters);
    const entertainment = await caller.analytics.overview({ timeRange: "all", category: "Entertainment" });

    expect(entertainment.recordsTotal).toBe(32_638);
    expect(entertainment.recordsUsed).toBeLessThan(all.recordsUsed);
    expect(entertainment.categories.every(item => item.label === "Entertainment")).toBe(true);
    expect(entertainment.totalViews).toBeLessThan(all.totalViews);
  });

  it("recalculates the overview when a date filter is applied", async () => {
    const caller = appRouter.createCaller(createContext());
    const all = await caller.analytics.overview(allFilters);
    const recent = await caller.analytics.overview({ timeRange: "30d", category: "all" });

    expect(recent.recordsTotal).toBe(32_638);
    expect(recent.recordsUsed).toBeGreaterThan(0);
    expect(recent.recordsUsed).toBeLessThan(all.recordsUsed);
    expect(recent.totalViews).toBeLessThan(all.totalViews);
  });

  it("answers a category question from the filtered full dataset with read-only SQL", async () => {
    const originalKey = process.env.BUILT_IN_FORGE_API_KEY;
    process.env.BUILT_IN_FORGE_API_KEY = "";

    try {
      const caller = appRouter.createCaller(createContext());
      const result = await caller.analytics.ask({ question: "Which categories drive the most views?", ...allFilters });
      expect(result.type).toBe("category");
      expect(result.sql.trim().toLowerCase().startsWith("select")).toBe(true);
      expect(result.answer.length).toBeGreaterThan(20);
      expect(result.rowsAnalyzed).toBe(32_638);
    } finally {
      process.env.BUILT_IN_FORGE_API_KEY = originalKey;
    }
  });
});
