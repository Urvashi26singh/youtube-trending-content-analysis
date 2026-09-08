# YouTube Trending Content Analysis

Signal Studio is a recruiter-ready end-to-end analytics case study for understanding YouTube trending content performance. The project combines Python/Pandas data cleaning, a MySQL-ready data model, SQL analysis, Power BI-oriented measures, a responsive dashboard, and a guarded natural-language analyst experience.

## Project objective

Analyze trending YouTube content to identify which categories, channels, and engagement patterns are associated with video performance, then translate those findings into practical recommendations for content creators. The analysis is observational: it describes patterns in the dataset and does not claim that any one factor causes performance.

## Data preparation

The documented cleaning pipeline is:

| Stage | Records |
|---|---:|
| Original dataset | 37,352 |
| Invalid video IDs removed | 511 |
| Duplicate records removed | 4,194 |
| Removed/error videos | 9 |
| Final cleaned dataset | 32,638 |

Python and Pandas were used for cleaning and preparation. The website now uses the complete 32,638-record cleaned CSV loaded into MySQL for every KPI, chart, filter, and AI analyst response.

## What is included

| Layer | Implementation |
|---|---|
| Data preparation | `tools/validate_cleaned_dataset.py` validates the supplied cleaned CSV, and `tools/import_cleaned_dataset.sh` loads all rows into MySQL. |
| Verified portfolio facts | `shared/portfolioFacts.ts` stores the documented cleaning counts, business questions, limitations, and source URL. |
| Data model | `drizzle/schema.ts` defines `youtube_videos` and `analytics_questions` tables for MySQL/TiDB. |
| Analytics API | `server/routers.ts` exposes overview metrics and a guarded read-only AI analyst procedure through tRPC. |
| Dashboard | `client/src/pages/Home.tsx` includes the original KPI cards, monthly reach, category mix, top channels, AI analyst, and the added portfolio case-study sections. |
| SQL examples | `sql/analytics_queries.sql` contains KPI, CASE, CTE, GROUP BY, HAVING, JOIN, DENSE_RANK, ROW_NUMBER, and LAG patterns. |
| Power BI handoff | The dashboard and SQL file document the same measures: total views, engagement rate, trending observations, unique videos, and creator activity. |

## Source data

The connected dataset was supplied as `youtube_trending_cleaned.csv` with exactly 32,638 rows and imported into MySQL. The large source file is not committed to the WebDev Git snapshot because the checkpoint remote rejects payloads of this size; see [`data/README.md`](data/README.md) for provenance. The public [Trending YouTube Video Statistics repository](https://github.com/lychengrex/Data-Analysis-of-Trending-Youtube-Videos) is retained as source context; the website calculations use the imported database rows.

```bash
python3 tools/validate_cleaned_dataset.py /path/to/youtube_trending_cleaned.csv
tools/import_cleaned_dataset.sh /path/to/youtube_trending_cleaned.csv
```

## Run locally

```bash
pnpm install
pnpm dev
```

The WebDev environment provides the database and built-in LLM credentials. The AI analyst uses the server-side `invokeLLM` helper when available and falls back to a deterministic read-only classifier; both summarize the same full-dataset rows selected by the dashboard filters. Generated SQL is surfaced for transparency.

## Suggested Power BI model

Load `youtube_videos` as the fact table. Create a calendar table from the normalized `trending_date`, relate it one-to-many to the fact table, and use `category` and `channel_title` as dimensions. Recommended measures are Total Views, Total Likes, Total Comments, Trending Observations, Unique Videos, Engagement Rate, Average Views, and Views per Trending Appearance.

## Portfolio resources

A public GitHub code repository and public Power BI report URL are not configured in the current WebDev project, so the website intentionally does not invent or display either link. The verified source repository, SQL analysis file, and project documentation are available within the project workspace.
