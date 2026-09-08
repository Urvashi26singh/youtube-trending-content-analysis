#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CSV_PATH="${1:-$PROJECT_ROOT/data/youtube_trending_cleaned.csv}"

if [[ ! -s "$CSV_PATH" ]]; then
  echo "Missing CSV: $CSV_PATH" >&2
  exit 1
fi
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not configured" >&2
  exit 1
fi

DB_URL_NO_QUERY="${DATABASE_URL%%\?*}"
DB_AUTH_HOST_DB="${DB_URL_NO_QUERY#mysql://}"
DB_USERPASS="${DB_AUTH_HOST_DB%@*}"
DB_HOST_DB="${DB_AUTH_HOST_DB#*@}"
DB_USER="${DB_USERPASS%%:*}"
DB_PASSWORD="${DB_USERPASS#*:}"
DB_HOSTPORT="${DB_HOST_DB%%/*}"
DB_NAME="${DB_HOST_DB#*/}"
DB_HOST="${DB_HOSTPORT%%:*}"
DB_PORT="${DB_HOSTPORT#*:}"
MYSQL_ARGS=(--protocol=tcp --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" --password="$DB_PASSWORD" --database="$DB_NAME" --ssl-mode=REQUIRED --local-infile=1)

mysql "${MYSQL_ARGS[@]}" <<SQL
TRUNCATE TABLE youtube_videos;
LOAD DATA LOCAL INFILE '$CSV_PATH'
INTO TABLE youtube_videos
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' ENCLOSED BY '"' ESCAPED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@video_id,@trending_date,@title,@channel_title,@category,@category_id,@publish_time,@tags,@views,@likes,@dislikes,@comment_count,@thumbnail_link,@comments_disabled,@ratings_disabled,@video_error_or_removed,@description)
SET
  video_id = NULLIF(@video_id, ''),
  title = @title,
  channel_title = @channel_title,
  category = @category,
  category_id = CAST(@category_id AS UNSIGNED),
  trending_date = @trending_date,
  published_at = STR_TO_DATE(REPLACE(NULLIF(@publish_time, ''), 'Z', ''), '%Y-%m-%dT%H:%i:%s.%f'),
  views = CAST(@views AS UNSIGNED),
  likes = CAST(@likes AS UNSIGNED),
  dislikes = CAST(@dislikes AS UNSIGNED),
  comment_count = CAST(@comment_count AS UNSIGNED),
  thumbnail_url = NULLIF(@thumbnail_link, '');
SQL

mysql "${MYSQL_ARGS[@]}" --batch --skip-column-names --execute='SELECT COUNT(*) AS total_rows, COUNT(DISTINCT video_id) AS unique_video_ids, COUNT(DISTINCT category) AS category_count, MIN(trending_date) AS min_trending_date_raw, MAX(trending_date) AS max_trending_date_raw FROM youtube_videos;'
