# Dataset provenance

The uploaded `youtube_trending_cleaned.csv` was validated at exactly **32,638 rows** and imported into the managed MySQL database table `youtube_videos`. The website reads the database table for every KPI, chart, filter, and AI analyst response.

The 52 MB CSV is intentionally not committed to the WebDev Git snapshot because the checkpoint remote rejects payloads of this size. The database import is the runtime source of truth. To reproduce the import, provide the same CSV through the project File Storage panel and run `tools/import_cleaned_dataset.sh` with the file path.
