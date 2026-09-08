import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, analyticsQuestions, users, youtubeVideos } from "../drizzle/schema";
import type { AnalyticsVideoRecord } from "../shared/types";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let analyticsRowsCache: AnalyticsVideoRecord[] | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAnalyticsRows(): Promise<AnalyticsVideoRecord[]> {
  if (analyticsRowsCache) return analyticsRowsCache;
  const db = await getDb();
  if (!db) throw new Error("Analytics database is unavailable; full cleaned dataset is not connected.");

  const rows = await db.select().from(youtubeVideos);
  if (rows.length === 0) throw new Error("Analytics dataset is empty; expected 32,638 cleaned observations.");

  analyticsRowsCache = rows.map(row => ({
    id: row.videoId,
    title: row.title,
    channel: row.channelTitle,
    category: row.category,
    categoryId: row.categoryId,
    trendingDate: row.trendingDate,
    publishedAt: row.publishedAt?.toISOString() ?? "",
    views: row.views,
    likes: row.likes,
    dislikes: row.dislikes,
    comments: row.commentCount,
    thumbnail: row.thumbnailUrl ?? "",
  }));
  return analyticsRowsCache;
}

export async function saveAnalyticsQuestion(question: string, generatedSql: string, answer: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(analyticsQuestions).values({ question, generatedSql, answer });
  } catch (error) {
    console.warn("[Database] Could not save analytics question:", error);
  }
}
