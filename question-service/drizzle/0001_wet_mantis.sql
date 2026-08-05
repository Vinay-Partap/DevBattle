CREATE TYPE "public"."asset_type" AS ENUM('starter_project', 'image', 'icon', 'font', 'json', 'svg', 'video', 'swagger', 'postman', 'rest_doc', 'other');--> statement-breakpoint
CREATE TYPE "public"."question_visibility" AS ENUM('public', 'private', 'organization');--> statement-breakpoint
CREATE TYPE "public"."reference_design_type" AS ENUM('desktop', 'tablet', 'mobile', 'figma', 'other');--> statement-breakpoint
CREATE TYPE "public"."requirement_type" AS ENUM('technology', 'file', 'feature', 'acceptance_criteria', 'api', 'database', 'auth', 'validation', 'business_logic', 'rubric');--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'sql' BEFORE 'frontend';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'backend' BEFORE 'fullstack';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'react';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'nodejs';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'javascript';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'typescript';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'html-css';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'bug-fixing';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'debugging';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'mcq';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'system-design';--> statement-breakpoint
ALTER TYPE "public"."problem_type" ADD VALUE 'ai-challenge';--> statement-breakpoint
CREATE TABLE "question_ai_review_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"criterion" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"type" "asset_type" DEFAULT 'other' NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_editorials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_hints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"language" varchar(50) NOT NULL,
	"display_name" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_reference_designs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"type" "reference_design_type" DEFAULT 'other' NOT NULL,
	"url" text,
	"figma_url" text,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"type" "requirement_type" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_supported_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question_test_cases" ADD COLUMN "explanation" text;--> statement-breakpoint
ALTER TABLE "question_test_cases" ADD COLUMN "weight" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "problem_statement" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "input_format" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "output_format" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "max_score" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "max_code_size_kb" integer DEFAULT 256 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "execution_timeout_ms" integer DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "visibility" "question_visibility" DEFAULT 'organization' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "plagiarism_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "similarity_threshold" integer DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "max_attempts" integer;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "submission_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "allow_late_submission" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "scoring_config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "question_ai_review_rules" ADD CONSTRAINT "question_ai_review_rules_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_assets" ADD CONSTRAINT "question_assets_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_editorials" ADD CONSTRAINT "question_editorials_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_hints" ADD CONSTRAINT "question_hints_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_languages" ADD CONSTRAINT "question_languages_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_reference_designs" ADD CONSTRAINT "question_reference_designs_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_requirements" ADD CONSTRAINT "question_requirements_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_supported_frameworks" ADD CONSTRAINT "question_supported_frameworks_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_topics" ADD CONSTRAINT "question_topics_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "question_ai_rules_question_criterion_idx" ON "question_ai_review_rules" USING btree ("question_id","criterion");--> statement-breakpoint
CREATE INDEX "question_assets_question_id_idx" ON "question_assets" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_assets_type_idx" ON "question_assets" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "question_editorials_question_id_idx" ON "question_editorials" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_hints_question_id_idx" ON "question_hints" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "question_languages_question_language_idx" ON "question_languages" USING btree ("question_id","language");--> statement-breakpoint
CREATE INDEX "question_reference_designs_question_id_idx" ON "question_reference_designs" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_requirements_question_id_idx" ON "question_requirements" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_requirements_type_idx" ON "question_requirements" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "question_frameworks_question_name_idx" ON "question_supported_frameworks" USING btree ("question_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "question_tags_question_name_idx" ON "question_tags" USING btree ("question_id","name");--> statement-breakpoint
CREATE INDEX "question_tags_name_idx" ON "question_tags" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "question_topics_question_name_idx" ON "question_topics" USING btree ("question_id","name");--> statement-breakpoint
CREATE INDEX "question_topics_name_idx" ON "question_topics" USING btree ("name");