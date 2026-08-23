-- V2: Composite PKs (report_id, id) so client-side IDs like c1/d1/i1
-- are unique per-report, not globally.

-- ─── Checklist Items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklist_items (
  id varchar NOT NULL,
  report_id varchar NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  workspace_id varchar NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category text NOT NULL,
  point text NOT NULL,
  status text,
  severity text,
  trigger_on text DEFAULT 'no',
  image_url text,
  work_status text,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (report_id, id)
);
CREATE INDEX IF NOT EXISTS checklist_items_workspace_idx ON checklist_items(workspace_id);

-- ─── Report Dimensions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_dimensions (
  id varchar NOT NULL,
  report_id varchar NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  workspace_id varchar NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  space text NOT NULL,
  space_name text,
  length text,
  width text,
  unit text DEFAULT 'ft',
  notes text,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (report_id, id)
);
CREATE INDEX IF NOT EXISTS report_dimensions_workspace_idx ON report_dimensions(workspace_id);

-- ─── Report Issues ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_issues (
  id varchar NOT NULL,
  report_id varchar NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  workspace_id varchar NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  note text,
  location text,
  responsible_engineer text,
  severity text,
  status text DEFAULT 'Open',
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (report_id, id)
);
CREATE INDEX IF NOT EXISTS report_issues_workspace_idx ON report_issues(workspace_id);

-- ─── Issue Images ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issue_images (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_report_id varchar NOT NULL,
  issue_id varchar NOT NULL,
  workspace_id varchar NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  gcp_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL,
  FOREIGN KEY (issue_report_id, issue_id) REFERENCES report_issues(report_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS issue_images_issue_idx ON issue_images(issue_report_id, issue_id);
