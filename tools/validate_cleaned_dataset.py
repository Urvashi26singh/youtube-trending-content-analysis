from __future__ import annotations

import csv
import sys
from pathlib import Path

EXPECTED_ROWS = 32_638
REQUIRED_COLUMNS = {
    "video_id",
    "trending_date",
    "title",
    "channel_title",
    "category",
    "category_id",
    "publish_time",
    "views",
    "likes",
    "dislikes",
    "comment_count",
}


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 tools/validate_cleaned_dataset.py <csv_path>")
    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        raise SystemExit(f"Missing CSV: {csv_path}")

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        columns = set(reader.fieldnames or [])
        missing = REQUIRED_COLUMNS - columns
        if missing:
            raise SystemExit(f"Missing required columns: {sorted(missing)}")
        count = 0
        empty_ids = 0
        unique_ids: set[str] = set()
        categories: set[str] = set()
        min_date = None
        max_date = None
        for row in reader:
            count += 1
            video_id = (row.get("video_id") or "").strip()
            if not video_id:
                empty_ids += 1
            unique_ids.add(video_id)
            categories.add((row.get("category") or "").strip())
            date = (row.get("trending_date") or "").strip()
            min_date = date if min_date is None or date < min_date else min_date
            max_date = date if max_date is None or date > max_date else max_date

    result = {
        "path": str(csv_path),
        "rows": count,
        "expected_rows": EXPECTED_ROWS,
        "row_count_matches": count == EXPECTED_ROWS,
        "columns": sorted(columns),
        "missing_columns": sorted(missing),
        "unique_video_ids": len(unique_ids),
        "empty_video_ids": empty_ids,
        "category_count": len(categories),
        "min_trending_date_raw": min_date,
        "max_trending_date_raw": max_date,
    }
    for key, value in result.items():
        print(f"{key}={value}")
    if count != EXPECTED_ROWS or missing or empty_ids:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
