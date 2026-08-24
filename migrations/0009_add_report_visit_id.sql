ALTER TABLE reports ADD COLUMN visit_id varchar REFERENCES visits(id) ON DELETE SET NULL;
