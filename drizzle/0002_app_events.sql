CREATE TABLE "app_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"guest_id" text,
	"tester_code" text,
	"name" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "app_events_name_time" ON "app_events" USING btree ("name","occurred_at");--> statement-breakpoint
CREATE INDEX "app_events_tester" ON "app_events" USING btree ("tester_code");--> statement-breakpoint
-- Only the app server (owner role) reads or writes events; the public API cannot.
ALTER TABLE "app_events" ENABLE ROW LEVEL SECURITY;
