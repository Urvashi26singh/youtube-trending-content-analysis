import { describe, expect, it } from "vitest";
import { portfolioFacts } from "../shared/portfolioFacts";

describe("portfolio facts", () => {
  it("reconciles the documented cleaning pipeline", () => {
    expect(
      portfolioFacts.rawRecords -
        portfolioFacts.invalidIdsRemoved -
        portfolioFacts.duplicatesRemoved -
        portfolioFacts.removedOrErrorVideos,
    ).toBe(portfolioFacts.cleanedRecords);
  });

  it("documents the exact connected dataset", () => {
    expect(portfolioFacts.cleanedRecords).toBe(32_638);
    expect(portfolioFacts.datasetFilename).toBe("youtube_trending_cleaned.csv");
  });
});
