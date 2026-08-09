// scripts/repro-pdf.tsx
import React from "react";
import { renderToFile } from "@react-pdf/renderer";

// client/src/components/CapturePDF.tsx
import { Document, Page, Text, View, Image, StyleSheet, Svg, Path, G } from "@react-pdf/renderer";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var PAGE_PADDING = 36;
var PAGE_W = 595.28;
var IMAGE_W = PAGE_W - PAGE_PADDING * 2;
var IMAGE_H = 350;
var DOT_SIZE = 10;
function severityColor(severity) {
  switch (severity) {
    case "Major":
      return "#dc2626";
    case "Cosmetic":
      return "#f97316";
    case "Minor":
      return "#22c55e";
    default:
      return "#3b82f6";
  }
}
function severityLabel(severity) {
  return severity || "Info";
}
var MAX_NOTES_CHARS = 500;
var MAX_LABEL_CHARS = 200;
var MAX_EVIDENCE_NOTES_CHARS = 250;
function clampText(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd() + "\u2026";
}
function statusColor(s) {
  switch (s) {
    case "Open":
      return "#991b1b";
    case "Resolved":
      return "#166534";
    case "In Progress":
      return "#92400e";
    default:
      return "#475569";
  }
}
function statusBg(s) {
  switch (s) {
    case "Open":
      return "#fef2f2";
    case "Resolved":
      return "#f0fdf4";
    case "In Progress":
      return "#fffbeb";
    default:
      return "#f1f5f9";
  }
}
var styles = StyleSheet.create({
  page: {
    padding: PAGE_PADDING,
    fontSize: 10,
    fontFamily: "Helvetica"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 14,
    marginBottom: 20
  },
  brandName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b"
  },
  brandSub: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2
  },
  meta: {
    alignItems: "flex-end"
  },
  metaLabel: {
    fontSize: 7,
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  metaValue: {
    fontSize: 8,
    color: "#1e293b",
    marginTop: 1
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16
  },
  sectionTitleLine: {
    width: 24,
    height: 2,
    backgroundColor: "#4f46e5",
    marginBottom: 10
  },
  imageWrapper: {
    width: IMAGE_W,
    height: IMAGE_H,
    position: "relative",
    marginBottom: 4
  },
  floorPlanImage: {
    width: IMAGE_W,
    height: IMAGE_H,
    objectFit: "contain"
  },
  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "#ffffff"
  },
  dotNumber: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  dotNumberText: {
    fontSize: 6,
    fontWeight: 700,
    color: "#ffffff"
  },
  imageCaption: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 12
  },
  pinTable: {
    marginTop: 8
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    backgroundColor: "#f8fafc"
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
    alignItems: "flex-start"
  },
  tableCell: {
    fontSize: 9,
    color: "#1e293b"
  },
  tableCellSmall: {
    fontSize: 7,
    color: "#64748b"
  },
  sevDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 3
  },
  badge: {
    fontSize: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2
  },
  legend: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 4
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5
  },
  legendText: {
    fontSize: 7,
    color: "#64748b"
  },
  // Cover page
  coverTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#4f46e5",
    marginTop: 40,
    marginBottom: 4
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 32
  },
  coverDivider: {
    width: 40,
    height: 3,
    backgroundColor: "#4f46e5",
    marginBottom: 32
  },
  coverSection: {
    marginBottom: 24
  },
  coverSectionLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4
  },
  coverSectionValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b"
  },
  coverSectionSub: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2
  },
  // Stats cards
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12
  },
  statCardAccent: {
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5"
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1e293b"
  },
  statLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2
  },
  // Severity bars
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8
  },
  barLabel: {
    width: 48,
    fontSize: 8,
    fontWeight: 600,
    color: "#1e293b"
  },
  barTrack: {
    flex: 1,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#f1f5f9",
    overflow: "hidden"
  },
  barFill: {
    height: 14,
    borderRadius: 3
  },
  barCount: {
    width: 20,
    fontSize: 8,
    fontWeight: 700,
    color: "#1e293b",
    textAlign: "right"
  },
  // Status row
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  statusBadge: {
    fontSize: 7,
    fontWeight: 700,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3
  },
  // Area summary page
  areaTableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingVertical: 6
  },
  areaTableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 5
  },
  areaTableTotalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingVertical: 5,
    fontWeight: 700
  },
  areaCell: {
    fontSize: 8,
    color: "#1e293b"
  },
  areaCellHeader: {
    fontSize: 7,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase"
  },
  donutContainer: {
    alignItems: "center",
    marginLeft: 24
  },
  donutLegend: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center"
  },
  donutLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  donutLegendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  donutLegendText: {
    fontSize: 6,
    color: "#64748b"
  }
});
function computeAreaSummary(captures) {
  const areaMap = /* @__PURE__ */ new Map();
  for (const c of captures) {
    const existing = areaMap.get(c.title) ?? { area: c.title, major: 0, minor: 0, cosmetic: 0, resolved: 0, total: 0 };
    areaMap.set(c.title, {
      area: c.title,
      major: existing.major + c.pins.filter((p) => p.severity === "Major").length,
      minor: existing.minor + c.pins.filter((p) => p.severity === "Minor").length,
      cosmetic: existing.cosmetic + c.pins.filter((p) => p.severity === "Cosmetic").length,
      resolved: existing.resolved + c.pins.filter((p) => p.status === "Resolved").length,
      total: existing.total + c.pins.length
    });
  }
  return Array.from(areaMap.values()).filter((a) => a.total > 0);
}
function AreaSummaryPage({
  cover: cover2,
  captures
}) {
  const date = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const summary = computeAreaSummary(captures);
  const allPins = captures.flatMap((c) => c.pins);
  const totals = summary.reduce(
    (acc, a) => ({
      major: acc.major + a.major,
      minor: acc.minor + a.minor,
      cosmetic: acc.cosmetic + a.cosmetic,
      resolved: acc.resolved + a.resolved,
      total: acc.total + a.total
    }),
    { major: 0, minor: 0, cosmetic: 0, resolved: 0, total: 0 }
  );
  const issueTypes = [
    { label: "MAJOR", count: totals.major, color: "#dc2626" },
    { label: "MINOR", count: totals.minor, color: "#22c55e" },
    { label: "COSMETIC", count: totals.cosmetic, color: "#f97316" }
  ];
  const openCount = allPins.filter((p) => p.status === "Open").length;
  const inProgressCount = allPins.filter((p) => p.status === "In Progress").length;
  const resolvedCount = totals.resolved;
  const resolutionTotal = openCount + resolvedCount + inProgressCount;
  return /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
    /* @__PURE__ */ jsxs(View, { style: styles.header, children: [
      (cover2.companyName || cover2.companyLogoUrl) && /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center", gap: 10 }, children: [
        cover2.companyLogoUrl && /* @__PURE__ */ jsx(
          Image,
          {
            src: cover2.companyLogoUrl,
            style: { width: 32, height: 32, objectFit: "contain" }
          }
        ),
        cover2.companyName && /* @__PURE__ */ jsxs(View, { children: [
          /* @__PURE__ */ jsx(Text, { style: styles.brandName, children: cover2.companyName }),
          cover2.companyAddress && /* @__PURE__ */ jsx(Text, { style: styles.brandSub, children: cover2.companyAddress })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: styles.meta, children: [
        /* @__PURE__ */ jsx(Text, { style: styles.metaLabel, children: "Area Summary" }),
        /* @__PURE__ */ jsx(Text, { style: styles.metaValue, children: date })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Text, { style: styles.sectionTitle, children: "Area Wise Defect Summary" }),
    /* @__PURE__ */ jsx(View, { style: styles.sectionTitleLine }),
    /* @__PURE__ */ jsxs(View, { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", backgroundColor: "#1e293b", paddingVertical: 6, paddingHorizontal: 8 }, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5, width: 80 }, children: "Area" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5, width: 50, textAlign: "right" }, children: "Major" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5, width: 50, textAlign: "right" }, children: "Minor" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5, width: 55, textAlign: "right" }, children: "Cosmetic" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5, width: 55, textAlign: "right" }, children: "Resolved" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5, width: 35, textAlign: "right" }, children: "Total" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5, flex: 1, textAlign: "right" }, children: "Progress" })
      ] }),
      summary.map((a, i) => {
        const pct = a.total > 0 ? Math.round(a.resolved / a.total * 100) : 0;
        return /* @__PURE__ */ jsxs(
          View,
          {
            style: {
              flexDirection: "row",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderBottomWidth: 0.5,
              borderBottomColor: "#f1f5f9",
              backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc"
            },
            children: [
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#1e293b", fontWeight: 600, width: 80 }, children: a.area }),
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#475569", width: 50, textAlign: "right" }, children: a.major || "\u2014" }),
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#475569", width: 50, textAlign: "right" }, children: a.minor || "\u2014" }),
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#475569", width: 55, textAlign: "right" }, children: a.cosmetic || "\u2014" }),
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#475569", width: 55, textAlign: "right" }, children: a.resolved || "\u2014" }),
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#1e293b", fontWeight: 700, width: 35, textAlign: "right" }, children: a.total }),
              /* @__PURE__ */ jsxs(View, { style: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 }, children: [
                /* @__PURE__ */ jsx(View, { style: { width: 60, height: 4, backgroundColor: "#f1f5f9", borderRadius: 2, overflow: "hidden" }, children: /* @__PURE__ */ jsx(View, { style: { width: `${pct}%`, height: 4, backgroundColor: "#10b981", borderRadius: 2 } }) }),
                /* @__PURE__ */ jsxs(Text, { style: { fontSize: 7, color: "#64748b", width: 28, textAlign: "right" }, children: [
                  pct,
                  "%"
                ] })
              ] })
            ]
          },
          a.area
        );
      }),
      summary.length > 1 && /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0", backgroundColor: "#f1f5f9" }, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#1e293b", fontWeight: 700, width: 80 }, children: "Total" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#1e293b", fontWeight: 700, width: 50, textAlign: "right" }, children: totals.major || "\u2014" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#1e293b", fontWeight: 700, width: 50, textAlign: "right" }, children: totals.minor || "\u2014" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#1e293b", fontWeight: 700, width: 55, textAlign: "right" }, children: totals.cosmetic || "\u2014" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#1e293b", fontWeight: 700, width: 55, textAlign: "right" }, children: totals.resolved || "\u2014" }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#1e293b", fontWeight: 700, width: 35, textAlign: "right" }, children: totals.total }),
        /* @__PURE__ */ jsxs(View, { style: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 }, children: [
          /* @__PURE__ */ jsx(View, { style: { width: 60, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, overflow: "hidden" }, children: /* @__PURE__ */ jsx(View, { style: { width: `${totals.total > 0 ? Math.round(totals.resolved / totals.total * 100) : 0}%`, height: 4, backgroundColor: "#059669", borderRadius: 2 } }) }),
          /* @__PURE__ */ jsxs(Text, { style: { fontSize: 7, fontWeight: 700, color: "#1e293b", width: 28, textAlign: "right" }, children: [
            totals.total > 0 ? Math.round(totals.resolved / totals.total * 100) : 0,
            "%"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", gap: 12 }, children: [
      /* @__PURE__ */ jsxs(View, { style: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, padding: 12 }, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, fontWeight: 700, color: "#1e293b", marginBottom: 10 }, children: "Issue Breakdown" }),
        issueTypes.map((s) => {
          const p = totals.total > 0 ? s.count / totals.total * 100 : 0;
          return /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 600, color: "#64748b", width: 52 }, children: s.label }),
            /* @__PURE__ */ jsx(View, { style: { flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 2, overflow: "hidden" }, children: /* @__PURE__ */ jsx(View, { style: { width: `${p}%`, height: 6, backgroundColor: s.color, borderRadius: 2 } }) }),
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#1e293b", width: 20, textAlign: "right" }, children: s.count }),
            /* @__PURE__ */ jsxs(Text, { style: { fontSize: 6, color: "#94a3b8", width: 28, textAlign: "right" }, children: [
              "(",
              p.toFixed(0),
              "%)"
            ] })
          ] }, s.label);
        }),
        /* @__PURE__ */ jsxs(View, { style: { borderTopWidth: 0.5, borderTopColor: "#e2e8f0", marginTop: 4, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#64748b" }, children: "TOTAL" }),
          /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, fontWeight: 700, color: "#1e293b" }, children: totals.total })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, padding: 12 }, children: [
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, fontWeight: 700, color: "#1e293b", marginBottom: 10 }, children: "Resolution Status" }),
        [
          { label: "RESOLVED", count: resolvedCount, color: "#22c55e" },
          { label: "OPEN", count: openCount, color: "#dc2626" },
          { label: "IN PROGRESS", count: inProgressCount, color: "#f97316" }
        ].map((s) => {
          const p = resolutionTotal > 0 ? s.count / resolutionTotal * 100 : 0;
          return /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 }, children: [
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 600, color: "#64748b", width: 52 }, children: s.label }),
            /* @__PURE__ */ jsx(View, { style: { flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 2, overflow: "hidden" }, children: /* @__PURE__ */ jsx(View, { style: { width: `${p}%`, height: 6, backgroundColor: s.color, borderRadius: 2 } }) }),
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#1e293b", width: 20, textAlign: "right" }, children: s.count }),
            /* @__PURE__ */ jsxs(Text, { style: { fontSize: 6, color: "#94a3b8", width: 28, textAlign: "right" }, children: [
              "(",
              p.toFixed(0),
              "%)"
            ] })
          ] }, s.label);
        }),
        /* @__PURE__ */ jsxs(View, { style: { borderTopWidth: 0.5, borderTopColor: "#e2e8f0", marginTop: 4, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, fontWeight: 700, color: "#64748b" }, children: "TOTAL" }),
          /* @__PURE__ */ jsx(Text, { style: { fontSize: 9, fontWeight: 700, color: "#1e293b" }, children: resolutionTotal })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: [styles.header, { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10, marginTop: 20, position: "absolute", bottom: 36, left: 36, right: 36 }], children: [
      /* @__PURE__ */ jsxs(Text, { style: { fontSize: 7, color: "#94a3b8" }, children: [
        cover2.companyName || "Workspace",
        cover2.companyPhone ? ` \xB7 ${cover2.companyPhone}` : ""
      ] }),
      /* @__PURE__ */ jsxs(Text, { style: { fontSize: 7, color: "#94a3b8" }, children: [
        "Report generated by Inspection OS \xA9 ",
        (/* @__PURE__ */ new Date()).getFullYear()
      ] })
    ] })
  ] });
}
function CaptureCoverPage({ cover: cover2 }) {
  const date = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const total = cover2.severityBreakdown.reduce((s, b) => s + b.count, 0);
  return /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
    /* @__PURE__ */ jsxs(View, { style: styles.header, children: [
      (cover2.companyName || cover2.companyLogoUrl) && /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center", gap: 10 }, children: [
        cover2.companyLogoUrl && /* @__PURE__ */ jsx(
          Image,
          {
            src: cover2.companyLogoUrl,
            style: { width: 32, height: 32, objectFit: "contain" }
          }
        ),
        cover2.companyName && /* @__PURE__ */ jsxs(View, { children: [
          /* @__PURE__ */ jsx(Text, { style: styles.brandName, children: cover2.companyName }),
          cover2.companyAddress && /* @__PURE__ */ jsx(Text, { style: styles.brandSub, children: cover2.companyAddress })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: styles.meta, children: [
        /* @__PURE__ */ jsx(Text, { style: styles.metaLabel, children: "Visual Summary" }),
        /* @__PURE__ */ jsx(Text, { style: styles.metaValue, children: date })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Text, { style: styles.coverTitle, children: "Visual Inspection Summary" }),
    /* @__PURE__ */ jsx(Text, { style: styles.coverSubtitle, children: cover2.projectTitle }),
    /* @__PURE__ */ jsx(View, { style: styles.coverDivider }),
    cover2.clientName && /* @__PURE__ */ jsxs(View, { style: styles.coverSection, children: [
      /* @__PURE__ */ jsx(Text, { style: styles.coverSectionLabel, children: "Client" }),
      /* @__PURE__ */ jsx(Text, { style: styles.coverSectionValue, children: cover2.clientName }),
      cover2.projectAddress && /* @__PURE__ */ jsx(Text, { style: styles.coverSectionSub, children: cover2.projectAddress })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: styles.statsRow, children: [
      /* @__PURE__ */ jsxs(View, { style: [styles.statCard, styles.statCardAccent], children: [
        /* @__PURE__ */ jsx(Text, { style: styles.statValue, children: cover2.totalCaptures }),
        /* @__PURE__ */ jsxs(Text, { style: styles.statLabel, children: [
          "Capture",
          cover2.totalCaptures !== 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: [styles.statCard, styles.statCardAccent], children: [
        /* @__PURE__ */ jsx(Text, { style: styles.statValue, children: cover2.totalHotspots }),
        /* @__PURE__ */ jsxs(Text, { style: styles.statLabel, children: [
          "Observation",
          cover2.totalHotspots !== 1 ? "s" : ""
        ] })
      ] })
    ] }),
    cover2.severityBreakdown.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Text, { style: styles.sectionTitle, children: "Severity Breakdown" }),
      /* @__PURE__ */ jsx(View, { style: styles.sectionTitleLine }),
      cover2.severityBreakdown.map((b) => /* @__PURE__ */ jsxs(View, { style: styles.barRow, children: [
        /* @__PURE__ */ jsx(Text, { style: styles.barLabel, children: b.severity }),
        /* @__PURE__ */ jsx(View, { style: styles.barTrack, children: /* @__PURE__ */ jsx(
          View,
          {
            style: [
              styles.barFill,
              {
                width: `${total > 0 ? b.count / total * 100 : 0}%`,
                backgroundColor: severityColor(b.severity)
              }
            ]
          }
        ) }),
        /* @__PURE__ */ jsx(Text, { style: styles.barCount, children: b.count })
      ] }, b.severity))
    ] }),
    cover2.statusBreakdown.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Text, { style: [styles.sectionTitle, { marginTop: 20 }], children: "Status Summary" }),
      /* @__PURE__ */ jsx(View, { style: styles.sectionTitleLine }),
      /* @__PURE__ */ jsx(View, { style: styles.statusRow, children: cover2.statusBreakdown.map((b) => /* @__PURE__ */ jsx(
        View,
        {
          style: [
            styles.statusBadge,
            { backgroundColor: statusBg(b.status) }
          ],
          children: /* @__PURE__ */ jsxs(
            Text,
            {
              style: {
                fontSize: 7,
                fontWeight: 700,
                color: statusColor(b.status)
              },
              children: [
                b.status,
                ": ",
                b.count
              ]
            }
          )
        },
        b.status
      )) })
    ] })
  ] });
}
var rowAvailableH = 90;
function estimateRowHeight(note, label) {
  const safeNote = note ? clampText(note, MAX_NOTES_CHARS) : null;
  const safeLabel = label ? clampText(label, MAX_LABEL_CHARS) : null;
  const labelColW = IMAGE_W * 0.26;
  const labelCharsPerLine = Math.floor(labelColW / 5);
  const labelLines = safeLabel ? Math.max(1, ...safeLabel.split("\n").map((s) => Math.ceil(s.length / Math.max(1, labelCharsPerLine)))) : 0;
  const notesColW = IMAGE_W * 0.3;
  const notesCharsPerLine = Math.floor(notesColW / 4.2);
  let notesLines = 0;
  if (safeNote) {
    const segments = safeNote.split("\n");
    for (const seg of segments) {
      notesLines += Math.max(1, Math.ceil(seg.length / Math.max(1, notesCharsPerLine)));
    }
  }
  const labelH = labelLines * 12 + 13;
  const notesH = notesLines * 10 + 13;
  return Math.round(Math.max(25, labelH, notesH) * 1.2);
}
function chunkPins(pins) {
  if (pins.length === 0) return [[]];
  const chunks = [];
  let i = 0;
  while (i < pins.length) {
    let used = 0;
    let count = 0;
    for (let j = i; j < pins.length; j++) {
      const h = estimateRowHeight(pins[j].notes, pins[j].label);
      if (used + h > rowAvailableH && count > 0) break;
      used += h;
      count++;
    }
    if (count === 0) count = 1;
    chunks.push(pins.slice(i, i + count));
    i += count;
  }
  return chunks;
}
function CapturePageContent({
  capture: capture2,
  pinsToShow,
  pinOffset,
  totalPins,
  pageNumber,
  totalPages
}) {
  const date = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const allPins = capture2.pins.map((p, i) => ({ ...p, number: i + 1 }));
  const visible = pinsToShow.map((p, i) => ({ ...p, number: pinOffset + i + 1 }));
  const imageAspect = capture2.imageWidth / capture2.imageHeight;
  const boxAspect = IMAGE_W / IMAGE_H;
  let renderW, renderH;
  if (imageAspect > boxAspect) {
    renderW = IMAGE_W;
    renderH = IMAGE_W / imageAspect;
  } else {
    renderH = IMAGE_H;
    renderW = IMAGE_H * imageAspect;
  }
  const offsetX = (IMAGE_W - renderW) / 2;
  const offsetY = (IMAGE_H - renderH) / 2;
  return /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
    /* @__PURE__ */ jsxs(View, { style: styles.header, children: [
      (capture2.companyName || capture2.companyLogoUrl) && /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center", gap: 10 }, children: [
        capture2.companyLogoUrl && /* @__PURE__ */ jsx(
          Image,
          {
            src: capture2.companyLogoUrl,
            style: { width: 32, height: 32, objectFit: "contain" }
          }
        ),
        capture2.companyName && /* @__PURE__ */ jsxs(View, { children: [
          /* @__PURE__ */ jsx(Text, { style: styles.brandName, children: capture2.companyName }),
          capture2.companyAddress && /* @__PURE__ */ jsx(Text, { style: styles.brandSub, children: capture2.companyAddress })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: styles.meta, children: [
        /* @__PURE__ */ jsx(Text, { style: styles.metaLabel, children: "Observation Report" }),
        /* @__PURE__ */ jsx(Text, { style: styles.metaValue, children: date })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { children: [
      /* @__PURE__ */ jsx(Text, { style: { fontSize: 16, fontWeight: 700, color: "#1e293b" }, children: capture2.title }),
      /* @__PURE__ */ jsxs(Text, { style: { fontSize: 9, color: "#64748b", marginTop: 3, marginBottom: 2 }, children: [
        "Project: ",
        capture2.projectTitle
      ] }),
      capture2.clientName && /* @__PURE__ */ jsxs(Text, { style: { fontSize: 8, color: "#94a3b8", marginBottom: 2 }, children: [
        "Client: ",
        capture2.clientName,
        capture2.projectAddress ? ` \xB7 ${capture2.projectAddress}` : ""
      ] }),
      /* @__PURE__ */ jsxs(Text, { style: { fontSize: 8, color: "#64748b", marginBottom: 4 }, children: [
        totalPins,
        " observation",
        totalPins !== 1 ? "s" : "",
        " found"
      ] })
    ] }),
    /* @__PURE__ */ jsx(Text, { style: styles.sectionTitle, children: "Reference Image" }),
    /* @__PURE__ */ jsx(View, { style: styles.sectionTitleLine }),
    /* @__PURE__ */ jsxs(View, { style: styles.imageWrapper, children: [
      /* @__PURE__ */ jsx(Image, { style: styles.floorPlanImage, src: capture2.imageUrl }),
      allPins.map((pin) => /* @__PURE__ */ jsx(
        View,
        {
          style: [
            styles.dotNumber,
            {
              left: offsetX + pin.x * renderW - DOT_SIZE / 2,
              top: offsetY + pin.y * renderH - DOT_SIZE / 2,
              backgroundColor: severityColor(pin.severity)
            }
          ],
          children: /* @__PURE__ */ jsx(Text, { style: styles.dotNumberText, children: pin.number })
        },
        pin.id
      ))
    ] }),
    totalPins > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(Text, { style: styles.sectionTitle, children: [
        "Observation Details",
        totalPages > 1 ? ` (Page ${pageNumber} of ${totalPages})` : ""
      ] }),
      /* @__PURE__ */ jsx(View, { style: styles.sectionTitleLine }),
      /* @__PURE__ */ jsxs(View, { style: styles.pinTable, children: [
        /* @__PURE__ */ jsxs(View, { style: styles.tableHeader, children: [
          /* @__PURE__ */ jsx(Text, { style: [{ width: "8%" }, styles.tableHeaderCell], children: "#" }),
          /* @__PURE__ */ jsx(Text, { style: [{ width: "26%" }, styles.tableHeaderCell], children: "Label" }),
          /* @__PURE__ */ jsx(Text, { style: [{ width: "18%" }, styles.tableHeaderCell], children: "Severity" }),
          /* @__PURE__ */ jsx(Text, { style: [{ width: "18%" }, styles.tableHeaderCell], children: "Status" }),
          /* @__PURE__ */ jsx(Text, { style: [{ width: "30%" }, styles.tableHeaderCell], children: "Recommendations" })
        ] }),
        visible.map((pin) => /* @__PURE__ */ jsxs(View, { wrap: false, style: styles.tableRow, children: [
          /* @__PURE__ */ jsx(Text, { style: [{ width: "8%" }, styles.tableCell], children: pin.number }),
          /* @__PURE__ */ jsxs(Text, { style: [{ width: "26%" }, styles.tableCell], children: [
            clampText(pin.label ?? "", MAX_LABEL_CHARS),
            pin.hasPhoto ? " \u{1F4F7}" : ""
          ] }),
          /* @__PURE__ */ jsxs(View, { style: { width: "18%", flexDirection: "row", alignItems: "center" }, children: [
            /* @__PURE__ */ jsx(View, { style: [styles.sevDot, { backgroundColor: severityColor(pin.severity) }] }),
            /* @__PURE__ */ jsx(Text, { style: { fontSize: 8, color: "#1e293b" }, children: severityLabel(pin.severity) })
          ] }),
          /* @__PURE__ */ jsx(View, { style: { width: "18%" }, children: pin.status ? /* @__PURE__ */ jsx(Text, { style: [
            styles.badge,
            {
              backgroundColor: pin.status === "Open" ? "#fef2f2" : pin.status === "Resolved" ? "#f0fdf4" : "#fffbeb",
              color: pin.status === "Open" ? "#991b1b" : pin.status === "Resolved" ? "#166534" : "#92400e"
            }
          ], children: pin.status }) : /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, color: "#94a3b8" }, children: "\u2014" }) }),
          /* @__PURE__ */ jsx(Text, { style: [{ width: "30%" }, styles.tableCellSmall], children: pin.notes ? clampText(pin.notes, MAX_NOTES_CHARS) : "\u2014" })
        ] }, pin.id))
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: { flex: 1 } }),
    pageNumber === 1 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Text, { style: [styles.sectionTitle, { marginTop: 20 }], children: "Severity" }),
      /* @__PURE__ */ jsx(View, { style: styles.sectionTitleLine }),
      /* @__PURE__ */ jsxs(View, { style: styles.legend, children: [
        /* @__PURE__ */ jsxs(View, { style: styles.legendItem, children: [
          /* @__PURE__ */ jsx(View, { style: [styles.legendDot, { backgroundColor: "#dc2626" }] }),
          /* @__PURE__ */ jsx(Text, { style: styles.legendText, children: "Major" })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: styles.legendItem, children: [
          /* @__PURE__ */ jsx(View, { style: [styles.legendDot, { backgroundColor: "#f97316" }] }),
          /* @__PURE__ */ jsx(Text, { style: styles.legendText, children: "Cosmetic" })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: styles.legendItem, children: [
          /* @__PURE__ */ jsx(View, { style: [styles.legendDot, { backgroundColor: "#22c55e" }] }),
          /* @__PURE__ */ jsx(Text, { style: styles.legendText, children: "Minor" })
        ] }),
        /* @__PURE__ */ jsxs(View, { style: styles.legendItem, children: [
          /* @__PURE__ */ jsx(View, { style: [styles.legendDot, { backgroundColor: "#3b82f6" }] }),
          /* @__PURE__ */ jsx(Text, { style: styles.legendText, children: "Info" })
        ] }),
        /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, color: "#94a3b8", marginLeft: 4 }, children: "\u{1F4F7} = Evidence photo | Before/After shown for Resolved items" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: { height: 24 } }),
    /* @__PURE__ */ jsxs(
      View,
      {
        style: {
          position: "absolute",
          left: PAGE_PADDING,
          right: PAGE_PADDING,
          bottom: PAGE_PADDING,
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          paddingTop: 8,
          flexDirection: "row",
          justifyContent: "space-between"
        },
        children: [
          /* @__PURE__ */ jsxs(Text, { style: { fontSize: 7, color: "#94a3b8" }, children: [
            capture2.companyName || "Workspace",
            capture2.companyPhone ? ` \xB7 ${capture2.companyPhone}` : ""
          ] }),
          /* @__PURE__ */ jsxs(Text, { style: { fontSize: 7, color: "#94a3b8" }, children: [
            "Report generated by Inspection OS \xA9 ",
            (/* @__PURE__ */ new Date()).getFullYear()
          ] })
        ]
      }
    )
  ] });
}
function ResolutionEvidencePage({
  capture: capture2,
  resolvedPins,
  pageNumber,
  totalPages
}) {
  const date = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const count = resolvedPins.length;
  const imgH = count === 1 ? 340 : 220;
  return /* @__PURE__ */ jsxs(Page, { size: "A4", style: styles.page, children: [
    /* @__PURE__ */ jsxs(View, { style: styles.header, children: [
      (capture2.companyName || capture2.companyLogoUrl) && /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center", gap: 10 }, children: [
        capture2.companyLogoUrl && /* @__PURE__ */ jsx(
          Image,
          {
            src: capture2.companyLogoUrl,
            style: { width: 32, height: 32, objectFit: "contain" }
          }
        ),
        capture2.companyName && /* @__PURE__ */ jsxs(View, { children: [
          /* @__PURE__ */ jsx(Text, { style: styles.brandName, children: capture2.companyName }),
          capture2.companyAddress && /* @__PURE__ */ jsx(Text, { style: styles.brandSub, children: capture2.companyAddress })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: styles.meta, children: [
        /* @__PURE__ */ jsx(Text, { style: styles.metaLabel, children: "Resolution Evidence" }),
        /* @__PURE__ */ jsx(Text, { style: styles.metaValue, children: date })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: { marginBottom: 16 }, children: [
      /* @__PURE__ */ jsx(Text, { style: { fontSize: 16, fontWeight: 700, color: "#1e293b" }, children: capture2.title }),
      /* @__PURE__ */ jsxs(Text, { style: { fontSize: 9, color: "#64748b", marginTop: 3 }, children: [
        "Project: ",
        capture2.projectTitle
      ] }),
      totalPages > 1 && /* @__PURE__ */ jsxs(Text, { style: { fontSize: 8, color: "#94a3b8", marginTop: 2 }, children: [
        "Page ",
        pageNumber,
        " of ",
        totalPages
      ] })
    ] }),
    /* @__PURE__ */ jsx(Text, { style: styles.sectionTitle, children: "Resolution Evidence" }),
    /* @__PURE__ */ jsx(View, { style: styles.sectionTitleLine }),
    resolvedPins.map((pin, idx) => {
      const pinNumber = capture2.pins.indexOf(pin) + 1;
      return /* @__PURE__ */ jsxs(
        View,
        {
          style: {
            flexDirection: "row",
            gap: 16,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            borderRadius: 6,
            padding: 12,
            marginBottom: idx < resolvedPins.length - 1 ? 12 : 0
          },
          wrap: false,
          children: [
            /* @__PURE__ */ jsxs(View, { style: { width: 140, justifyContent: "flex-start" }, children: [
              /* @__PURE__ */ jsxs(View, { style: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }, children: [
                /* @__PURE__ */ jsxs(Text, { style: { fontSize: 12, fontWeight: 700, color: "#1e293b" }, children: [
                  "#",
                  pinNumber
                ] }),
                /* @__PURE__ */ jsx(Text, { style: [styles.badge, { backgroundColor: "#f0fdf4", color: "#166534" }], children: "Resolved" })
              ] }),
              /* @__PURE__ */ jsx(Text, { style: { fontSize: 10, fontWeight: 600, color: "#334155", marginBottom: 4 }, children: pin.label }),
              pin.notes && /* @__PURE__ */ jsx(Text, { style: { fontSize: 7, color: "#94a3b8", lineHeight: 11 }, children: clampText(pin.notes, MAX_EVIDENCE_NOTES_CHARS) })
            ] }),
            /* @__PURE__ */ jsx(View, { style: { flex: 1, borderWidth: 1, borderColor: "#d1fae5", borderRadius: 4, overflow: "hidden" }, children: /* @__PURE__ */ jsx(
              Image,
              {
                src: pin.resolvedPhoto,
                style: { width: "100%", height: imgH, objectFit: "contain", backgroundColor: "#f8fafc" }
              }
            ) })
          ]
        },
        pin.id
      );
    }),
    /* @__PURE__ */ jsx(View, { style: { flex: 1 } }),
    /* @__PURE__ */ jsx(View, { style: { height: 24 } }),
    /* @__PURE__ */ jsxs(
      View,
      {
        style: {
          position: "absolute",
          left: PAGE_PADDING,
          right: PAGE_PADDING,
          bottom: PAGE_PADDING,
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          paddingTop: 8,
          flexDirection: "row",
          justifyContent: "space-between"
        },
        children: [
          /* @__PURE__ */ jsxs(Text, { style: { fontSize: 7, color: "#94a3b8" }, children: [
            capture2.companyName || "Workspace",
            capture2.companyPhone ? ` \xB7 ${capture2.companyPhone}` : ""
          ] }),
          /* @__PURE__ */ jsxs(Text, { style: { fontSize: 7, color: "#94a3b8" }, children: [
            "Report generated by Inspection OS \xA9 ",
            (/* @__PURE__ */ new Date()).getFullYear()
          ] })
        ]
      }
    )
  ] });
}
function CapturePDF({ captures, cover: cover2 }) {
  function chunkResolved(pins) {
    const chunks = [];
    for (let i = 0; i < pins.length; i += 2) {
      chunks.push(pins.slice(i, i + 2));
    }
    return chunks;
  }
  return /* @__PURE__ */ jsxs(Document, { children: [
    cover2 && /* @__PURE__ */ jsx(CaptureCoverPage, { cover: cover2 }),
    cover2 && captures.length > 0 && /* @__PURE__ */ jsx(AreaSummaryPage, { cover: cover2, captures }),
    captures.map((capture2) => {
      const chunks = chunkPins(capture2.pins);
      const resolvedPins = capture2.pins.filter((p) => p.status === "Resolved" && p.resolvedPhoto);
      const resolvedChunks = chunkResolved(resolvedPins);
      let runningOffset = 0;
      const observationPages = chunks.map((chunk, i) => {
        const offset = runningOffset;
        runningOffset += chunk.length;
        return /* @__PURE__ */ jsx(
          CapturePageContent,
          {
            capture: capture2,
            pinsToShow: chunk,
            pinOffset: offset,
            totalPins: capture2.pins.length,
            pageNumber: i + 1,
            totalPages: chunks.length
          },
          `${capture2.title}-obs-${i}`
        );
      });
      const evidencePages = resolvedChunks.map((chunk, i) => /* @__PURE__ */ jsx(
        ResolutionEvidencePage,
        {
          capture: capture2,
          resolvedPins: chunk,
          pageNumber: i + 1,
          totalPages: resolvedChunks.length
        },
        `${capture2.title}-evidence-${i}`
      ));
      return [...observationPages, ...evidencePages];
    })
  ] });
}

// scripts/repro-pdf.tsx
var capture = {
  projectTitle: "Sky Lounge",
  title: "Rahul",
  imageUrl: "https://storage.googleapis.com/reportgen-images-rahul/1781932994059-b2fb844c-checklist_c305.jpg",
  imageWidth: 1200,
  imageHeight: 800,
  totalCaptures: 1,
  pins: [
    { id: "e5cbbc4b", number: 1, label: "Unsealed joint", x: 0.8, y: 0.3, severity: "Info", status: "Open" },
    { id: "da0df652", number: 2, label: "Crack in plaster", x: 0.3, y: 0.7, severity: "Minor", status: "Open" },
    { id: "d08c51e2", number: 3, label: "Water stain on ceiling", x: 0.5, y: 0.5, severity: "Major", status: "Open" }
  ]
};
var cover = {
  projectTitle: "Sky Lounge",
  totalCaptures: 1,
  totalHotspots: 3,
  severityBreakdown: [
    { severity: "Major", count: 1 },
    { severity: "Cosmetic", count: 0 },
    { severity: "Minor", count: 1 },
    { severity: "Info", count: 1 }
  ],
  statusBreakdown: [{ status: "Open", count: 3 }]
};
var out = process.argv[2] || "/tmp/repro.pdf";
await renderToFile(
  React.createElement(CapturePDF, { captures: [capture], cover }),
  out
);
console.log("wrote", out);
