CREATE TABLE `analytics_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` text NOT NULL,
	`generated_sql` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtube_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`video_id` varchar(32) NOT NULL,
	`title` text NOT NULL,
	`channel_title` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL,
	`trending_date` varchar(16) NOT NULL,
	`published_at` timestamp,
	`views` bigint NOT NULL,
	`likes` bigint NOT NULL,
	`dislikes` bigint NOT NULL,
	`comment_count` bigint NOT NULL,
	`thumbnail_url` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `youtube_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtube_videos_video_id_unique` UNIQUE(`video_id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` varchar(16) NOT NULL DEFAULT 'user';