ALTER TABLE "visits" ADD COLUMN "date" text;

UPDATE "visits"
SET "date" = to_char("created_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
WHERE "date" IS NULL;

ALTER TABLE "visits" ALTER COLUMN "date" SET NOT NULL;
