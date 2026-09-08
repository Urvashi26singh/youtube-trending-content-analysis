-- YouTube Trending Content Analysis
-- MySQL 8+ / TiDB-compatible examples for the Power BI semantic layer.
-- The source uses YouTube's compact YY.DD.MM trending_date format.

-- 1) KPI layer: reach, engagement, and creator activity.
WITH base AS (
  SELECT
    video_id,
    channel_title,
    category,
    views,
    likes,
    comment_count,
    NULLIF(views, 0) AS safe_views
  FROM youtube_videos
)
SELECT
  COUNT(*) AS trending_observations,
  COUNT(DISTINCT video_id) AS unique_videos,
  COUNT(DISTINCT channel_title) AS active_channels,
  SUM(views) AS total_views,
  SUM(likes) AS total_likes,
  SUM(comment_count) AS total_comments,
  AVG((likes + comment_count) / safe_views) * 100 AS avg_engagement_rate
FROM base;

-- 2) Category comparison using CASE and GROUP BY.
SELECT
  CASE
    WHEN category IN ('Music', 'Entertainment') THEN 'Reach drivers'
    WHEN category IN ('Howto & Style', 'Science & Technology') THEN 'Consideration drivers'
    ELSE 'Niche / community'
  END AS category_group,
  category,
  SUM(views) AS total_views,
  AVG((likes + comment_count) / NULLIF(views, 0)) * 100 AS engagement_rate
FROM youtube_videos
GROUP BY category_group, category
ORDER BY total_views DESC;

-- 3) Channel ranking with a CTE and DENSE_RANK window function.
WITH channel_metrics AS (
  SELECT
    channel_title,
    COUNT(*) AS trending_observations,
    COUNT(DISTINCT video_id) AS unique_videos,
    SUM(views) AS total_views,
    AVG((likes + comment_count) / NULLIF(views, 0)) * 100 AS engagement_rate
  FROM youtube_videos
  GROUP BY channel_title
)
SELECT
  channel_title,
  trending_observations,
  unique_videos,
  total_views,
  engagement_rate,
  DENSE_RANK() OVER (ORDER BY total_views DESC) AS reach_rank
FROM channel_metrics
ORDER BY reach_rank, channel_title
LIMIT 25;

-- 4) Monthly trend analysis with explicit YY.DD.MM normalization.
WITH prepared AS (
  SELECT
    *,
    STR_TO_DATE(
      CONCAT('20', SUBSTRING_INDEX(trending_date, '.', 1), '-', SUBSTRING_INDEX(trending_date, '.', -1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(trending_date, '.', 2), '.', -1)),
      '%Y-%m-%d'
    ) AS trending_day
  FROM youtube_videos
)
SELECT
  DATE_FORMAT(trending_day, '%Y-%m') AS month,
  SUM(views) AS total_views,
  SUM(likes + comment_count) / NULLIF(SUM(views), 0) * 100 AS engagement_rate,
  COUNT(*) AS trending_observations
FROM prepared
GROUP BY month
ORDER BY month;

-- 5) Top videos within each category using ROW_NUMBER().
WITH ranked_videos AS (
  SELECT
    video_id,
    title,
    category,
    channel_title,
    views,
    likes,
    comment_count,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY views DESC) AS category_rank
  FROM youtube_videos
)
SELECT *
FROM ranked_videos
WHERE category_rank <= 3
ORDER BY category, category_rank;

-- 6) HAVING example: channels with repeat trending presence.
SELECT
  channel_title,
  COUNT(DISTINCT video_id) AS unique_videos,
  SUM(views) AS total_views
FROM youtube_videos
GROUP BY channel_title
HAVING COUNT(DISTINCT video_id) >= 3
ORDER BY total_views DESC;

-- 7) JOIN example: compare channel reach with its leading category.
WITH channel_metrics AS (
  SELECT channel_title, SUM(views) AS total_views
  FROM youtube_videos
  GROUP BY channel_title
), channel_categories AS (
  SELECT channel_title, category, SUM(views) AS category_views
  FROM youtube_videos
  GROUP BY channel_title, category
)
SELECT
  cm.channel_title,
  cm.total_views,
  cc.category AS leading_category,
  cc.category_views
FROM channel_metrics cm
JOIN channel_categories cc ON cc.channel_title = cm.channel_title
ORDER BY cm.total_views DESC, cc.category_views DESC;

-- 8) Month-over-month change using LAG().
WITH monthly AS (
  SELECT
    STR_TO_DATE(
      CONCAT('20', SUBSTRING_INDEX(trending_date, '.', 1), '-', SUBSTRING_INDEX(trending_date, '.', -1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(trending_date, '.', 2), '.', -1)),
      '%Y-%m-%d'
    ) AS trending_day,
    SUM(views) AS total_views
  FROM youtube_videos
  GROUP BY DATE_FORMAT(trending_day, '%Y-%m')
)
SELECT
  DATE_FORMAT(trending_day, '%Y-%m') AS month,
  total_views,
  total_views - LAG(total_views) OVER (ORDER BY trending_day) AS change_vs_previous_month
FROM monthly
ORDER BY month;

-- Power BI measure equivalents:
-- Total Views = SUM(youtube_videos[views])
-- Total Likes = SUM(youtube_videos[likes])
-- Total Comments = SUM(youtube_videos[comment_count])
-- Trending Observations = COUNTROWS(youtube_videos)
-- Unique Videos = DISTINCTCOUNT(youtube_videos[video_id])
-- Engagement Rate = DIVIDE([Total Likes] + [Total Comments], [Total Views])
