import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getAnalyticsRows, saveAnalyticsQuestion } from "./db";
import type { AnalyticsVideoRecord } from "../shared/types";

const timeRanges = ["all", "30d", "90d", "180d"] as const;
type TimeRange = (typeof timeRanges)[number];

const analyticsFilterSchema = z.object({
  timeRange: z.enum(timeRanges).default("all"),
  category: z.string().default("all"),
});
type AnalyticsFilters = z.infer<typeof analyticsFilterSchema>;

const questionSchema = z.object({
  question: z.string().min(3).max(240),
  timeRange: z.enum(timeRanges).default("all"),
  category: z.string().default("all"),
});
const queryTypes = ["category", "channel", "monthly", "engagement", "topVideos", "help"] as const;
type QueryType = (typeof queryTypes)[number];

function compactNumber(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

function engagementRate(video: Pick<AnalyticsVideoRecord, "views" | "likes" | "comments">) {
  return video.views ? ((video.likes + video.comments) / video.views) * 100 : 0;
}

function isoDateKey(raw: string) {
  if (/^\d{2}\.\d{2}\.\d{2}$/.test(raw)) {
    const [year, day, month] = raw.split(".");
    return `20${year}-${month}-${day}`;
  }
  return raw.slice(0, 10);
}

function monthKey(raw: string) {
  return isoDateKey(raw).slice(0, 7);
}

function filterRows(rows: AnalyticsVideoRecord[], filters: AnalyticsFilters) {
  const categoryFiltered = filters.category === "all" ? rows : rows.filter(row => row.category === filters.category);
  if (filters.timeRange === "all" || categoryFiltered.length === 0) return categoryFiltered;

  const maxDate = categoryFiltered.reduce((latest, row) => Math.max(latest, Date.parse(isoDateKey(row.trendingDate))), 0);
  const days = Number(filters.timeRange.replace("d", ""));
  const cutoff = maxDate - days * 24 * 60 * 60 * 1000;
  return categoryFiltered.filter(row => Date.parse(isoDateKey(row.trendingDate)) >= cutoff);
}

function classifyQuestion(question: string): { type: QueryType; sql: string } {
  const normalized = question.toLowerCase();
  if (normalized.includes("category") || normalized.includes("categories")) {
    return { type: "category", sql: "SELECT category, SUM(views) AS total_views, AVG((likes + comment_count) / NULLIF(views, 0)) AS engagement_rate FROM youtube_videos GROUP BY category ORDER BY total_views DESC;" };
  }
  if (normalized.includes("channel") || normalized.includes("creator")) {
    return { type: "channel", sql: "SELECT channel_title, SUM(views) AS total_views, COUNT(*) AS trending_observations, AVG((likes + comment_count) / NULLIF(views, 0)) AS engagement_rate FROM youtube_videos GROUP BY channel_title ORDER BY total_views DESC LIMIT 5;" };
  }
  if (normalized.includes("month") || normalized.includes("trend") || normalized.includes("over time")) {
    return { type: "monthly", sql: "SELECT trending_date, SUM(views) AS total_views FROM youtube_videos GROUP BY trending_date ORDER BY trending_date;" };
  }
  if (normalized.includes("engagement") || normalized.includes("like") || normalized.includes("comment")) {
    return { type: "engagement", sql: "SELECT category, AVG((likes + comment_count) / NULLIF(views, 0)) AS engagement_rate FROM youtube_videos GROUP BY category ORDER BY engagement_rate DESC;" };
  }
  if (normalized.includes("top") || normalized.includes("best") || normalized.includes("video")) {
    return { type: "topVideos", sql: "SELECT title, channel_title, views, likes, comment_count FROM youtube_videos ORDER BY views DESC LIMIT 5;" };
  }
  return { type: "help", sql: "-- Try a category, channel, monthly trend, engagement, or top videos question." };
}

function summarize(type: QueryType, rows: AnalyticsVideoRecord[]) {
  if (type === "category") {
    const grouped = new Map<string, { views: number; likes: number; comments: number }>();
    rows.forEach(row => {
      const current = grouped.get(row.category) ?? { views: 0, likes: 0, comments: 0 };
      grouped.set(row.category, { views: current.views + row.views, likes: current.likes + row.likes, comments: current.comments + row.comments });
    });
    const sorted = Array.from(grouped.entries()).sort((a, b) => b[1].views - a[1].views).slice(0, 5);
    const leader = sorted[0];
    return `**${leader?.[0] ?? "The leading category"}** is the strongest view driver at **${compactNumber(leader?.[1].views ?? 0)}** across the selected dataset slice. The top five categories account for ${compactNumber(sorted.reduce((sum, [, item]) => sum + item.views, 0))} views.`;
  }
  if (type === "channel") {
    const grouped = new Map<string, { views: number; videos: number }>();
    rows.forEach(row => {
      const current = grouped.get(row.channel) ?? { views: 0, videos: 0 };
      grouped.set(row.channel, { views: current.views + row.views, videos: current.videos + 1 });
    });
    const leader = Array.from(grouped.entries()).sort((a, b) => b[1].views - a[1].views)[0];
    return `**${leader?.[0] ?? "The leading channel"}** leads the selected dataset slice with **${compactNumber(leader?.[1].views ?? 0)}** total views across ${leader?.[1].videos ?? 0} trending observations. Consider this a benchmark for creator-level reach.`;
  }
  if (type === "monthly") {
    const months = new Map<string, number>();
    rows.forEach(row => {
      const month = monthKey(row.trendingDate);
      months.set(month, (months.get(month) ?? 0) + row.views);
    });
    const sorted = Array.from(months.entries()).sort((a, b) => b[1] - a[1]);
    return `The strongest monthly view concentration is **${sorted[0]?.[0] ?? "the selected period"}** at **${compactNumber(sorted[0]?.[1] ?? 0)}** views. Use the monthly view pattern to time format experiments and campaign launches.`;
  }
  if (type === "engagement") {
    const ranked = rows.map(row => ({ row, rate: engagementRate(row) })).sort((a, b) => b.rate - a.rate);
    const average = rows.reduce((sum, row) => sum + engagementRate(row), 0) / Math.max(rows.length, 1);
    return `Average engagement is **${average.toFixed(2)}%** in the selected dataset slice. The top video, **${ranked[0]?.row.title ?? "the current leader"}**, reaches **${ranked[0]?.rate.toFixed(2) ?? "0.00"}%**.`;
  }
  if (type === "topVideos") {
    const leader = [...rows].sort((a, b) => b.views - a.views)[0];
    return `The top video is **${leader?.title ?? "not available"}** from **${leader?.channel ?? "an unknown channel"}** with **${compactNumber(leader?.views ?? 0)}** views. Pair reach with engagement before deciding what to replicate.`;
  }
  return `Try questions like **Which categories drive the most views?**, **Who are the top channels?**, or **How does engagement change over time?**`;
}

async function translateQuestion(question: string) {
  const fallback = classifyQuestion(question);
  if (!process.env.BUILT_IN_FORGE_API_KEY) return fallback;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You translate business questions into safe, read-only MySQL analytics query plans. Return JSON only. Use one of queryType: category, channel, monthly, engagement, topVideos, help. Never use INSERT, UPDATE, DELETE, DROP, ALTER, or subqueries outside the youtube_videos table." },
        { role: "user", content: `Question: ${question}\nFallback plan: ${JSON.stringify(fallback)}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analytics_query_plan",
          strict: true,
          schema: {
            type: "object",
            properties: { queryType: { type: "string", enum: queryTypes }, sql: { type: "string" } },
            required: ["queryType", "sql"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    const parsed = JSON.parse(typeof content === "string" ? content : "{}");
    if (queryTypes.includes(parsed.queryType) && typeof parsed.sql === "string" && /^\s*select/i.test(parsed.sql)) {
      return { type: parsed.queryType as QueryType, sql: parsed.sql };
    }
  } catch (error) {
    console.warn("[AI analytics] Falling back to deterministic query plan:", error);
  }
  return fallback;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  analytics: router({
    overview: publicProcedure.input(analyticsFilterSchema).query(async ({ input }) => {
      const allRows = await getAnalyticsRows();
      const rows = filterRows(allRows, input);
      const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
      const totalLikes = rows.reduce((sum, row) => sum + row.likes, 0);
      const totalComments = rows.reduce((sum, row) => sum + row.comments, 0);
      const avgEngagement = rows.reduce((sum, row) => sum + engagementRate(row), 0) / Math.max(rows.length, 1);
      const channels = new Map<string, { views: number; videos: number; likes: number; comments: number }>();
      const categories = new Map<string, number>();
      const categoryMetrics = new Map<string, { views: number; likes: number; comments: number; observations: number }>();
      const months = new Map<string, { views: number; likes: number; comments: number }>();
      rows.forEach(row => {
        const current = channels.get(row.channel) ?? { views: 0, videos: 0, likes: 0, comments: 0 };
        channels.set(row.channel, { views: current.views + row.views, videos: current.videos + 1, likes: current.likes + row.likes, comments: current.comments + row.comments });
        categories.set(row.category, (categories.get(row.category) ?? 0) + row.views);
        const categoryMetric = categoryMetrics.get(row.category) ?? { views: 0, likes: 0, comments: 0, observations: 0 };
        categoryMetrics.set(row.category, { views: categoryMetric.views + row.views, likes: categoryMetric.likes + row.likes, comments: categoryMetric.comments + row.comments, observations: categoryMetric.observations + 1 });
        const month = monthKey(row.trendingDate);
        const monthly = months.get(month) ?? { views: 0, likes: 0, comments: 0 };
        months.set(month, { views: monthly.views + row.views, likes: monthly.likes + row.likes, comments: monthly.comments + row.comments });
      });
      const topChannels = Array.from(channels.entries()).sort((a, b) => b[1].views - a[1].views).slice(0, 5).map(([name, value]) => ({ name, videos: value.videos, views: value.views, engagement: ((value.likes + value.comments) / Math.max(value.views, 1)) * 100 }));
      const categoryPalette = ["#4f46e5", "#f97316", "#0ea5e9", "#22c55e", "#eab308", "#ec4899"];
      const categoryData = Array.from(categories.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value], index) => ({ label, value, color: categoryPalette[index % categoryPalette.length] }));
      const categoryEngagement = Array.from(categoryMetrics.entries()).map(([label, value]) => ({ label, value: ((value.likes + value.comments) / Math.max(value.views, 1)) * 100, observations: value.observations, views: value.views })).sort((a, b) => b.value - a.value);
      const monthlyAll = Array.from(months.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const monthly = monthlyAll.slice(-8).map(([month, value]) => ({ month: month.slice(5), views: value.views, engagement: ((value.likes + value.comments) / Math.max(value.views, 1)) * 100 }));
      const peakMonth = [...monthlyAll].sort((a, b) => b[1].views - a[1].views)[0];
      const topVideos = [...rows].sort((a, b) => b.views - a.views).slice(0, 6).map(row => ({ ...row, engagement: engagementRate(row) }));
      const availableCategories = Array.from(new Set(allRows.map(row => row.category))).sort();
      return { totalViews, totalLikes, totalComments, avgEngagement, videosTrending: rows.length, activeChannels: channels.size, topChannels, categories: categoryData, categoryEngagement, monthly, peakMonth: peakMonth ? { month: peakMonth[0], views: peakMonth[1].views } : null, topVideos, availableCategories, recordsTotal: allRows.length, recordsUsed: rows.length, sourceLabel: "youtube_trending_cleaned.csv · full cleaned dataset", filters: input };
    }),
    ask: publicProcedure.input(questionSchema).mutation(async ({ input }) => {
      const allRows = await getAnalyticsRows();
      const rows = filterRows(allRows, input);
      const plan = await translateQuestion(input.question);
      const filteredSql = `${plan.sql}\n-- Applied dashboard filters: timeRange=${input.timeRange}, category=${input.category}`;
      const answer = summarize(plan.type, rows);
      await saveAnalyticsQuestion(input.question, filteredSql, answer);
      return { ...plan, sql: filteredSql, answer, rowsAnalyzed: rows.length, generatedAt: new Date().toISOString() };
    }),
  }),
});

export type AppRouter = typeof appRouter;
