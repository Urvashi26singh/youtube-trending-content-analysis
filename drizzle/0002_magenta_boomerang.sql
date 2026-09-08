ALTER TABLE `youtube_videos` DROP INDEX `youtube_videos_video_id_unique`;--> statement-breakpoint
ALTER TABLE `youtube_videos` ADD `category_id` int NOT NULL;