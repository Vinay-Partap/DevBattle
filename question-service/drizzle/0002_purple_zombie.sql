ALTER TYPE "public"."problem_type" ADD VALUE 'html' BEFORE 'html-css';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'css' BEFORE 'html-css';--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "evaluation_config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "type_specific_config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "public_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;