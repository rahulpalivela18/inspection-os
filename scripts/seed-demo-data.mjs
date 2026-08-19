// Demo-data seeder. Logs in as the test admin and floods the first project
// with visits, tags, captures (tagged + untagged) and hotspots, reusing a
// single image URL. For local testing only.
//
// Usage: node scripts/seed-demo-data.mjs
// Env: BASE_URL (default http://localhost:5002), EMAIL/PASSWORD

const BASE = process.env.BASE_URL || "http://localhost:5002";
const EMAIL = process.env.EMAIL || "admin@test.com";
const PASSWORD = process.env.PASSWORD || "12345678";
const IMG =
  "https://storage.googleapis.com/reportgen-images-rahul/1781932994059-b2fb844c-checklist_c305.jpg";

let cookie = "";

async function login() {
  const res = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const setCookie = res.headers.get("set-cookie") || "";
  cookie = setCookie.split(";")[0];
  await res.arrayBuffer();
}

async function api(path, body) {
  const res = await fetch(BASE + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text().catch(() => "");
  if (res.status === 404 && !body) return null;
  if (!res.ok) return { _error: true, status: res.status, text: text.slice(0, 160) };
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function main() {
  await login();
  console.log(`Logged in as ${EMAIL}`);

  const projects = await api("/api/projects");
  if (!projects?.length || projects._error)
    throw new Error("No project found. Create one first via the UI.");
  const pid = projects[0].id;
  console.log(`Project: ${projects[0].title} (${pid})`);

  // ---- Seed tag values across all categories (idempotent) ----
  const categorySeed = {
    block: ["Block 1", "Block 2", "Block 3", "Block 4"],
    floor: ["1", "2", "3", "4", "5", "Roof"],
    flat: ["101", "102", "201", "202", "301", "Penthouse"],
    amenity: ["Gym", "Pool", "Cafe", "Roof Top", "Lobby", "Parking", "Lift", "Garden"],
  };
  const tagMap = {};
  for (const [category, values] of Object.entries(categorySeed)) {
    tagMap[category] = {};
    for (const value of values) {
      const t = await api(`/api/projects/${pid}/tag-values`, { category, value });
      if (t?.status !== undefined) {
        console.log(`  tag ${category}/${value} skipped: ${t.text}`);
        continue;
      }
      tagMap[category][value] = t.id;
      console.log(`  tag ${category}/${value} -> ${t.id}`);
    }
  }

  // ---- Seed visits ----
  const stageNames = [
    "Initial Inspection",
    "C Structure - Wind Point",
    "Stage Inspection - Mar 2026",
    "Defect Audit",
    "Final Handover",
  ];
  const visits = [];
  const existingVisits = await api(`/api/projects/${pid}/visits`);
  const byTitle = new Map(
    (Array.isArray(existingVisits) ? existingVisits : []).map((v) => [v.title, v]),
  );
  for (const title of stageNames) {
    const existing = byTitle.get(title);
    if (existing) {
      visits.push(existing);
      console.log(`  visit "${title}" reused -> ${existing.id}`);
      continue;
    }
    const v = await api(`/api/projects/${pid}/visits`, { title });
    if (v?.status !== undefined) {
      console.log(`  visit ${title} skipped: ${v.text}`);
      continue;
    }
    visits.push(v);
    console.log(`  visit "${title}" -> ${v.id}`);
  }

  // ---- Capacities ----
  const keysOf = (o) => Object.keys(o);
  let totalCaptures = 0;
  let taggedCount = 0;
  let untaggedCount = 0;

  for (let si = 0; si < visits.length; si++) {
    const visit = visits[si];
    const perStage = 9;
    for (let ci = 0; ci < perStage; ci++) {
      const blockKeys = keysOf(tagMap.block);
      const floorKeys = keysOf(tagMap.floor);
      const amenKeys = keysOf(tagMap.amenity);

      // Deterministic-ish tag combo per (stage,capture)
      const blockValue = blockKeys[(si + ci) % blockKeys.length];
      const floorValue = floorKeys[(ci + si) % floorKeys.length];
      const amenValue = amenKeys[(ci * 2 + si) % amenKeys.length];

      const c = await api(`/api/projects/${pid}/captures`, {
        title: `${visit.title} - ${blockValue}/F${floorValue} photo ${ci + 1}`,
        imageUrl: IMG,
        thumbnailUrl: IMG,
        width: 1200,
        height: 800,
        is360: ci % 9 === 5,
        visitId: visit.id,
        tagValueIds: [
          tagMap.block[blockValue],
          tagMap.floor[floorValue],
          tagMap.amenity[amenValue],
        ],
      });
      if (c?.status !== undefined) {
        console.log(`  [capture ${si}-${ci}] skipped: ${c.text}`);
        continue;
      }
      totalCaptures++;
      taggedCount++;
      console.log(`  capture #${totalCaptures} -> ${c.id}`);
    }
  }

  // ---- A batch of explicitly UNTAGGED captures (no tagValueIds) ----
  const lastVisit = visits[visits.length - 1];
  for (let u = 0; u < 12; u++) {
    const c = await api(`/api/projects/${pid}/captures`, {
      title: `Untagged photo ${u + 1}`,
      imageUrl: IMG,
      thumbnailUrl: IMG,
      width: 1200,
      height: 800,
      is360: false,
      visitId: lastVisit.id,
    });
    if (c?.status !== undefined) {
      console.log(`  [untagged ${u}] skip`);
      continue;
    }
    totalCaptures++;
    untaggedCount++;
    console.log(`  UNTAGGED photo #${u + 1} -> ${c.id}`);
  }

  // ---- Add hotspots to a few captures ----
  let hotspotCount = 0;
  const withHotspots = await api(
    `/api/projects/${pid}/captures?limit=${totalCaptures || 1}`,
  );
  const captureList = Array.isArray(withHotspots) ? withHotspots : [];
  for (const cap of captureList.slice(0, 6)) {
    for (const [x, y, label] of [
      [0.5, 0.5, "Water stain on ceiling"],
      [0.3, 0.7, "Crack in plaster"],
      [0.8, 0.3, "Unsealed joint"],
    ]) {
      const h = await api(`/api/captures/${cap.id}/hotspots`, {
        x: String(x),
        y: String(y),
        label,
        notes: `Demo issue pin (from seeder)`,
        issueSeverity: "medium",
        issueStatus: "open",
        panoUrl: IMG,
      });
      if (h?.status !== undefined) continue;
      hotspotCount++;
    }
  }

  console.log("\n=== SEED SUMMARY ===");
  console.log(`Visits:        ${visits.length}`);
  console.log(`Tag values:    ${Object.keys(tagMap).reduce((n, k) => n + keysOf(tagMap[k]).length, 0)}`);
  console.log(`Captures:      ${totalCaptures} (${taggedCount} tagged, ${untaggedCount} untagged)`);
  console.log(`Hotspots:      ${hotspotCount}`);
  console.log("\nDone. Refresh the CaptureManager page.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});