CREATE SEQUENCE "public"."sync_version" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"bucket" text NOT NULL,
	"day" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "ai_usage_bucket_day_pk" PRIMARY KEY("bucket","day")
);
--> statement-breakpoint
CREATE TABLE "dish_library" (
	"name_key" text PRIMARY KEY NOT NULL,
	"dish" jsonb NOT NULL,
	"recognized" boolean NOT NULL,
	"model" text NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredient_reports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text,
	"report" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_rows" (
	"user_id" text NOT NULL,
	"entity" text NOT NULL,
	"key" text NOT NULL,
	"data" jsonb,
	"deleted" boolean DEFAULT false NOT NULL,
	"updated_at" bigint NOT NULL,
	"version" bigint NOT NULL,
	CONSTRAINT "sync_rows_user_id_entity_key_pk" PRIMARY KEY("user_id","entity","key")
);
--> statement-breakpoint
CREATE INDEX "sync_rows_user_version" ON "sync_rows" USING btree ("user_id","version");