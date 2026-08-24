CREATE TABLE "checklist_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"category" text NOT NULL,
	"point" text NOT NULL,
	"status" text,
	"severity" text,
	"trigger_on" text DEFAULT 'no',
	"image_url" text,
	"work_status" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_images" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"gcp_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_dimensions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"space" text NOT NULL,
	"space_name" text,
	"length" text,
	"width" text,
	"unit" text DEFAULT 'ft',
	"notes" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_issues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" varchar NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"location" text,
	"responsible_engineer" text,
	"severity" text,
	"status" text DEFAULT 'Open',
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_images" ADD CONSTRAINT "issue_images_issue_id_report_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."report_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_images" ADD CONSTRAINT "issue_images_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_dimensions" ADD CONSTRAINT "report_dimensions_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_dimensions" ADD CONSTRAINT "report_dimensions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_issues" ADD CONSTRAINT "report_issues_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_issues" ADD CONSTRAINT "report_issues_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checklist_items_report_idx" ON "checklist_items" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "checklist_items_workspace_idx" ON "checklist_items" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "issue_images_issue_idx" ON "issue_images" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "report_dimensions_report_idx" ON "report_dimensions" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_issues_report_idx" ON "report_issues" USING btree ("report_id");