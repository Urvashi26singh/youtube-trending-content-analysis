import { bigint, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 16 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const youtubeVideos = mysqlTable("youtube_videos", {
  id: int("id").autoincrement().primaryKey(),
  videoId: varchar("video_id", { length: 32 }).notNull(),
  title: text("title").notNull(),
  channelTitle: varchar("channel_title", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  categoryId: int("category_id").notNull(),
  trendingDate: varchar("trending_date", { length: 16 }).notNull(),
  publishedAt: timestamp("published_at"),
  views: bigint("views", { mode: "number" }).notNull(),
  likes: bigint("likes", { mode: "number" }).notNull(),
  dislikes: bigint("dislikes", { mode: "number" }).notNull(),
  commentCount: bigint("comment_count", { mode: "number" }).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsQuestions = mysqlTable("analytics_questions", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),
  generatedSql: text("generated_sql").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type YoutubeVideo = typeof youtubeVideos.$inferSelect;
export type AnalyticsQuestion = typeof analyticsQuestions.$inferSelect;
