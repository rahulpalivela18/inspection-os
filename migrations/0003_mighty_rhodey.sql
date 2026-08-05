CREATE TABLE "workspace_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"label" text NOT NULL,
	"rate" numeric DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'flat' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotations" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "client_name" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "client_phone" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "client_email" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "property_address" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "property_type" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "bedrooms" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "bathrooms" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "area_sqft" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "tax_rate" text DEFAULT '18';--> statement-breakpoint
ALTER TABLE "workspace_rates" ADD CONSTRAINT "workspace_rates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" DROP COLUMN "hotspot_id";--> statement-breakpoint
ALTER TABLE "quotation_items" DROP COLUMN "capture_id";--> statement-breakpoint
ALTER TABLE "quotation_items" DROP COLUMN "severity";--> statement-breakpoint
ALTER TABLE "quotation_items" DROP COLUMN "is_manual";