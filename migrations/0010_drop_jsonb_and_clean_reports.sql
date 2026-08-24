-- Option B: Clean break from JSONB.
-- Run AFTER backing up prod data.

-- 1. Delete all existing reports (cascades to checklist_items, report_dimensions, report_issues, issue_images)
DELETE FROM reports;

-- 2. Drop JSONB columns from reports table
ALTER TABLE reports DROP COLUMN IF EXISTS checklist;
ALTER TABLE reports DROP COLUMN IF EXISTS dimensions;
ALTER TABLE reports DROP COLUMN IF EXISTS issues;
ALTER TABLE reports DROP COLUMN IF EXISTS space_counts;

-- 3. Create new empty reports for projects that had them
-- (executed after deploy, by the deploy script or manually)
-- Projects: Utkarsha Capital Towers, Aspen castle, MVV GV, Green city, Kommadi
