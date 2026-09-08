/**
 * Unified type exports.
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export type AnalyticsVideoRecord = {
  id: string;
  title: string;
  channel: string;
  category: string;
  categoryId: number;
  trendingDate: string;
  publishedAt: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  thumbnail: string;
};
