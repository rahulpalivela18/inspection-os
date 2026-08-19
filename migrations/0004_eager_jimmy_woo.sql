CREATE TABLE "spatial"."capture_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"capture_id" varchar NOT NULL,
	"tag_value_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag_values" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"project_id" varchar NOT NULL,
	"category" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"project_id" varchar NOT NULL,
	"title" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "spatial"."captures" ADD COLUMN "visit_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_type" text DEFAULT 'single' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "spatial"."capture_tags" ADD CONSTRAINT "capture_tags_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spatial"."capture_tags" ADD CONSTRAINT "capture_tags_capture_id_captures_id_fk" FOREIGN KEY ("capture_id") REFERENCES "spatial"."captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spatial"."capture_tags" ADD CONSTRAINT "capture_tags_tag_value_id_tag_values_id_fk" FOREIGN KEY ("tag_value_id") REFERENCES "public"."tag_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_values" ADD CONSTRAINT "tag_values_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_values" ADD CONSTRAINT "tag_values_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "capture_tags_unique" ON "spatial"."capture_tags" USING btree ("capture_id","tag_value_id");--> statement-breakpoint
CREATE INDEX "capture_tags_tagvalue_idx" ON "spatial"."capture_tags" USING btree ("tag_value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_values_unique" ON "tag_values" USING btree ("project_id","category",lower("value"));--> statement-breakpoint
CREATE INDEX "tag_values_lookup_idx" ON "tag_values" USING btree ("project_id","category");--> statement-breakpoint
CREATE INDEX "visits_project_idx" ON "visits" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "visits_unique_title" ON "visits" USING btree ("project_id",lower("title"));--> statement-breakpoint
ALTER TABLE "spatial"."captures" ADD CONSTRAINT "captures_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;