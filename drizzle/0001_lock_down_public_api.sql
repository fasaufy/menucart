-- Supabase exposes the public schema through its REST API. MenuCart only reaches
-- these tables from its own server (as the owner role, which bypasses RLS), so
-- turn row-level security on with no policies: the public API can't read or write them.
ALTER TABLE "sync_rows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dish_library" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ingredient_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;
