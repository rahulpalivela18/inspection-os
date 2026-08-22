-- Backfill script: reads JSONB from reports and inserts into normalized tables.
-- Safe to run multiple times (uses ON CONFLICT to skip already-migrated data).
-- Run AFTER 0007_normalize_reports.sql

-- ─── Checklist Items ─────────────────────────────────────────────────────────
INSERT INTO checklist_items (id, report_id, workspace_id, category, point, status, severity, trigger_on, image_url, work_status, "order", created_at)
SELECT
  (item->>'id')::varchar,
  r.id,
  r.workspace_id,
  (item->>'category')::text,
  (item->>'point')::text,
  (item->>'status')::text,
  (item->>'severity')::text,
  (item->>'triggerOn')::text,
  (item->>'image')::text,
  (item->>'workStatus')::text,
  idx - 1,
  NOW()
FROM reports r,
LATERAL jsonb_array_elements(COALESCE(r.checklist, '[]'::jsonb)) WITH ORDINALITY AS t(item, idx)
ON CONFLICT (id) DO NOTHING;

-- ─── Report Dimensions ───────────────────────────────────────────────────────
INSERT INTO report_dimensions (id, report_id, workspace_id, space, space_name, length, width, unit, notes, "order", created_at)
SELECT
  (dim->>'id')::varchar,
  r.id,
  r.workspace_id,
  (dim->>'space')::text,
  (dim->>'spaceName')::text,
  (dim->>'length')::text,
  (dim->>'width')::text,
  (dim->>'unit')::text,
  (dim->>'notes')::text,
  idx - 1,
  NOW()
FROM reports r,
LATERAL jsonb_array_elements(COALESCE(r.dimensions, '[]'::jsonb)) WITH ORDINALITY AS t(dim, idx)
ON CONFLICT (id) DO NOTHING;

-- ─── Report Issues + Issue Images ────────────────────────────────────────────
INSERT INTO report_issues (id, report_id, workspace_id, title, note, location, responsible_engineer, severity, status, "order", created_at)
SELECT
  (iss->>'id')::varchar,
  r.id,
  r.workspace_id,
  (iss->>'title')::text,
  (iss->>'note')::text,
  (iss->>'location')::text,
  (iss->>'responsibleEngineer')::text,
  (iss->>'severity')::text,
  (iss->>'status')::text,
  idx - 1,
  NOW()
FROM reports r,
LATERAL jsonb_array_elements(COALESCE(r.issues, '[]'::jsonb)) WITH ORDINALITY AS t(iss, idx)
ON CONFLICT (id) DO NOTHING;

-- Issue images: extract from each issue's "images" array
INSERT INTO issue_images (id, issue_id, workspace_id, gcp_url, sort_order, created_at)
SELECT
  gen_random_uuid()::varchar,
  ri.id,
  ri.workspace_id,
  img_url::text,
  img_idx - 1,
  NOW()
FROM report_issues ri
JOIN reports r ON r.id = ri.report_id
CROSS JOIN LATERAL jsonb_array_elements(
  COALESCE(
    (SELECT iss->'images' FROM jsonb_array_elements(COALESCE(r.issues, '[]'::jsonb)) iss WHERE iss->>'id' = ri.id),
    '[]'::jsonb
  )
) WITH ORDINALITY AS t(img_url, img_idx)
ON CONFLICT DO NOTHING;
