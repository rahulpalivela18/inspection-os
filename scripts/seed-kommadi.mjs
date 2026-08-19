// Temp data seeder for the local "Kommadi Inspection" project.
// Uses the real API so data flows exactly like the app (captures -> hotspots).
//
// Usage: node scripts/seed-kommadi.mjs
// Env: BASE_URL (default http://localhost:5002), EMAIL/PASSWORD

const BASE = process.env.BASE_URL || "http://localhost:5002";
const EMAIL = process.env.EMAIL || "admin@test.com";
const PASSWORD = process.env.PASSWORD || "12345678";
const PROJECT_ID = "af6e1c55-aa37-4828-b2b0-81e22c94dc0f"; // Kommadi Inspection
const IMG =
  "https://storage.googleapis.com/reportgen-images-rahul/1781932994059-b2fb844c-checklist_c305.jpg";
// Real image dims (3264x2448) — NOT the seed-script 1200x800, so the PDF
// letterbox and canvas pin math line up.
const W = 3264;
const H = 2448;

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

  // ---- Visits ----
  const visits = await api(`/api/projects/${PROJECT_ID}/visits`);
  if (!Array.isArray(visits) || visits.length === 0)
    throw new Error("Kommadi project has no visits — create one in the UI first.");
  console.log(`Visits: ${visits.map((v) => v.title).join(", ")}`);

  // ---- Captures (one tagged-ish batch per visit, plus a couple untagged) ----
  const names = [
    "Living Room",
    "Master Bedroom",
    "Kitchen",
    "Bathroom",
    "Staircase",
    "Terrace",
  ];
  const captures = [];
  let ci = 0;
  for (const visit of visits) {
    for (let i = 0; i < 3; i++) {
      const title = `${names[ci % names.length]} ${visit.title}`;
      ci++;
      const c = await api(`/api/projects/${PROJECT_ID}/captures`, {
        title,
        imageUrl: IMG,
        thumbnailUrl: IMG,
        width: W,
        height: H,
        is360: false,
        visitId: visit.id,
      });
      if (c?.status !== undefined) {
        console.log(`  [capture] skipped: ${c.text}`);
        continue;
      }
      captures.push({ ...c, visitTitle: visit.title });
      console.log(`  capture "${title}" -> ${c.id}`);
    }
  }

  // A couple of untagged captures (no visit grouping visual, still valid)
  for (let u = 0; u < 2; u++) {
    const c = await api(`/api/projects/${PROJECT_ID}/captures`, {
      title: `Spare photo ${u + 1}`,
      imageUrl: IMG,
      thumbnailUrl: IMG,
      width: W,
      height: H,
      is360: false,
      visitId: visits[0].id,
    });
    if (c?.status !== undefined) continue;
    captures.push({ ...c, visitTitle: visits[0].title });
    console.log(`  capture "Spare photo ${u + 1}" -> ${c.id}`);
  }

  // ---- Hotspots on a few captures ----
  const sev = ["Major", "Minor", "Cosmetic", "Info"];
  const statuses = ["Open", "In Progress", "Resolved"];
  const pins = [
    [0.5, 0.5, "Water stain on ceiling", "Major", "Open"],
    [0.3, 0.7, "Crack in plaster", "Minor", "In Progress"],
    [0.8, 0.3, "Unsealed joint", "Info", "Open"],
    [0.15, 0.2, "Peeling paint", "Cosmetic", "Resolved"],
  ];
  let hotspotCount = 0;
  for (const cap of captures.slice(0, 6)) {
    for (const [x, y, label, severity, status] of pins) {
      const h = await api(`/api/captures/${cap.id}/hotspots`, {
        x: String(x),
        y: String(y),
        label,
        notes: `Temp pin "${label}" on ${cap.title}`,
        issueSeverity: severity,
        issueStatus: status,
        panoUrl: IMG,
      });
      if (h?.status !== undefined) continue;
      hotspotCount++;
    }
  }

  console.log("\n=== SEED SUMMARY ===");
  console.log(`Captures:      ${captures.length}`);
  console.log(`Hotspots:      ${hotspotCount}`);
  console.log("\nDone. Refresh the CaptureManager page for Kommadi.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
