// One-time backfill for the capture-first + faceted-tags migration.
//
// `captures.visit_id` is NOT NULL in shared/schema.ts. On a fresh database
// (e.g. a new local Postgres) that's a non-issue — there are no existing
// rows to violate the constraint, and `npm run db:push` just works.
//
// On a database that already has captures WITHOUT a visit_id (e.g. the real
// Railway data), pushing this schema directly will fail, because Postgres
// can't add a NOT NULL column with no way to backfill existing rows. The
// correct order for that case is:
//   1. Temporarily relax `captures.visitId` to nullable in schema.ts, push.
//   2. Run this script (creates one "Pre-existing captures" visit per
//      project, then points every visit-less capture at it).
//   3. Restore `captures.visitId` to NOT NULL in schema.ts, push again —
//      this now succeeds because every row has a visit_id.
//
// ALWAYS take a full `pg_dump` backup and run this against a LOCAL restore
// of that dump first before ever running it against Railway.
//
// Usage: DATABASE_URL=<target db> npx tsx script/backfill-visits.ts

import { db } from "../server/db";
import { projects, visits, captures } from "@shared/schema";
import { eq, isNull, sql } from "drizzle-orm";

async function main() {
  const allProjects = await db.select().from(projects);
  let projectsTouched = 0;
  let capturesBackfilled = 0;

  for (const project of allProjects) {
    const orphaned = await db
      .select({ id: captures.id })
      .from(captures)
      .where(
        sql`${captures.projectId} = ${project.id} AND ${isNull(captures.visitId)}`,
      );

    if (orphaned.length === 0) continue;

    const [backfillVisit] = await db
      .insert(visits)
      .values({
        workspaceId: project.workspaceId,
        projectId: project.id,
        title: "Pre-existing captures",
      })
      .returning();

    await db
      .update(captures)
      .set({ visitId: backfillVisit.id })
      .where(
        sql`${captures.projectId} = ${project.id} AND ${isNull(captures.visitId)}`,
      );

    projectsTouched++;
    capturesBackfilled += orphaned.length;
    console.log(
      `  ${project.title}: created "Pre-existing captures" visit, backfilled ${orphaned.length} capture(s)`,
    );
  }

  console.log(
    `\nDone. ${projectsTouched} project(s) touched, ${capturesBackfilled} capture(s) backfilled.`,
  );

  const [{ count: remaining }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(captures)
    .where(isNull(captures.visitId));
  console.log(
    `Captures still without a visit_id: ${remaining} (must be 0 before applying the NOT NULL constraint).`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
