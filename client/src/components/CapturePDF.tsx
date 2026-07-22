import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const PAGE_PADDING = 36;
const PAGE_W = 595.28;
const IMAGE_W = PAGE_W - PAGE_PADDING * 2;
const IMAGE_H = 350;
const DOT_SIZE = 10;

function severityColor(severity?: string) {
  switch (severity) {
    case "Major": return "#dc2626";
    case "Cosmetic": return "#f97316";
    case "Minor": return "#22c55e";
    default: return "#3b82f6";
  }
}

function severityLabel(severity?: string) {
  return severity || "Info";
}

const SEVERITIES = ["Major", "Cosmetic", "Minor", "Info"] as const;
const STATUSES = ["Open", "In Progress", "Resolved"] as const;

function statusColor(s?: string) {
  switch (s) {
    case "Open": return "#991b1b";
    case "Resolved": return "#166534";
    case "In Progress": return "#92400e";
    default: return "#475569";
  }
}

function statusBg(s?: string) {
  switch (s) {
    case "Open": return "#fef2f2";
    case "Resolved": return "#f0fdf4";
    case "In Progress": return "#fffbeb";
    default: return "#f1f5f9";
  }
}

const styles = StyleSheet.create({
  page: {
    padding: PAGE_PADDING,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 14,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
  },
  brandSub: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  meta: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 7,
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 8,
    color: "#1e293b",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitleLine: {
    width: 24,
    height: 2,
    backgroundColor: "#4f46e5",
    marginBottom: 10,
  },
  imageWrapper: {
    width: IMAGE_W,
    height: IMAGE_H,
    position: "relative",
    marginBottom: 4,
  },
  floorPlanImage: {
    width: IMAGE_W,
    height: IMAGE_H,
    objectFit: "contain",
  },
  dot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  dotNumber: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  dotNumberText: {
    fontSize: 6,
    fontWeight: 700,
    color: "#ffffff",
  },
  imageCaption: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 12,
  },
  pinTable: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    backgroundColor: "#f8fafc",
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
    alignItems: "flex-start",
  },
  tableCell: {
    fontSize: 9,
    color: "#1e293b",
  },
  tableCellSmall: {
    fontSize: 7,
    color: "#64748b",
  },
  sevDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 3,
  },
  badge: {
    fontSize: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  legend: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 7,
    color: "#64748b",
  },
  // Cover page
  coverTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#4f46e5",
    marginTop: 40,
    marginBottom: 4,
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 32,
  },
  coverDivider: {
    width: 40,
    height: 3,
    backgroundColor: "#4f46e5",
    marginBottom: 32,
  },
  coverSection: {
    marginBottom: 24,
  },
  coverSectionLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  coverSectionValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
  },
  coverSectionSub: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },

  // Stats cards
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 12,
  },
  statCardAccent: {
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1e293b",
  },
  statLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2,
  },

  // Severity bars
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  barLabel: {
    width: 48,
    fontSize: 8,
    fontWeight: 600,
    color: "#1e293b",
  },
  barTrack: {
    flex: 1,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#f1f5f9",
    overflow: "hidden",
  },
  barFill: {
    height: 14,
    borderRadius: 3,
  },
  barCount: {
    width: 20,
    fontSize: 8,
    fontWeight: 700,
    color: "#1e293b",
    textAlign: "right",
  },

  // Status row
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 7,
    fontWeight: 700,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },

});

interface PinPDF {
  id: string;
  number: number;
  label: string;
  x: number;
  y: number;
  severity?: string;
  status?: string;
  notes?: string;
  hasPhoto?: boolean;
  panoUrl?: string;
  resolvedPhoto?: string;
}

interface CapturePDF {
  projectTitle: string;
  title: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  pins: PinPDF[];
  totalCaptures: number;
  companyName?: string;
  companyLogoUrl?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  clientName?: string;
  projectAddress?: string;
}

interface SeverityStat {
  severity: string;
  count: number;
}

interface StatusStat {
  status: string;
  count: number;
}

interface CapturePDFCover {
  projectTitle: string;
  clientName?: string;
  projectAddress?: string;
  companyName?: string;
  companyLogoUrl?: string;
  companyAddress?: string;
  companyPhone?: string;
  totalCaptures: number;
  totalHotspots: number;
  severityBreakdown: SeverityStat[];
  statusBreakdown: StatusStat[];
}

interface CapturePDFProps {
  captures: CapturePDF[];
  cover?: CapturePDFCover;
}

function CaptureCoverPage({ cover }: { cover: CapturePDFCover }) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const total = cover.severityBreakdown.reduce((s, b) => s + b.count, 0);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {(cover.companyName || cover.companyLogoUrl) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {cover.companyLogoUrl && (
              <Image
                src={cover.companyLogoUrl}
                style={{ width: 32, height: 32, objectFit: "contain" }}
              />
            )}
            {cover.companyName && (
              <View>
                <Text style={styles.brandName}>{cover.companyName}</Text>
                {cover.companyAddress && (
                  <Text style={styles.brandSub}>{cover.companyAddress}</Text>
                )}
              </View>
            )}
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Visual Summary</Text>
          <Text style={styles.metaValue}>{date}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.coverTitle}>Visual Inspection Summary</Text>
      <Text style={styles.coverSubtitle}>{cover.projectTitle}</Text>
      <View style={styles.coverDivider} />

      {/* Client info */}
      {cover.clientName && (
        <View style={styles.coverSection}>
          <Text style={styles.coverSectionLabel}>Client</Text>
          <Text style={styles.coverSectionValue}>{cover.clientName}</Text>
          {cover.projectAddress && (
            <Text style={styles.coverSectionSub}>{cover.projectAddress}</Text>
          )}
        </View>
      )}

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardAccent]}>
          <Text style={styles.statValue}>{cover.totalCaptures}</Text>
          <Text style={styles.statLabel}>
            Capture{cover.totalCaptures !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={[styles.statCard, styles.statCardAccent]}>
          <Text style={styles.statValue}>{cover.totalHotspots}</Text>
          <Text style={styles.statLabel}>
            Observation{cover.totalHotspots !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Severity breakdown */}
      {cover.severityBreakdown.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Severity Breakdown</Text>
          <View style={styles.sectionTitleLine} />
          {cover.severityBreakdown.map((b) => (
            <View key={b.severity} style={styles.barRow}>
              <Text style={styles.barLabel}>{b.severity}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${total > 0 ? (b.count / total) * 100 : 0}%`,
                      backgroundColor: severityColor(b.severity),
                    },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{b.count}</Text>
            </View>
          ))}
        </>
      )}

      {/* Status breakdown */}
      {cover.statusBreakdown.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
            Status Summary
          </Text>
          <View style={styles.sectionTitleLine} />
          <View style={styles.statusRow}>
            {cover.statusBreakdown.map((b) => (
              <View
                key={b.status}
                style={[
                  styles.statusBadge,
                    { backgroundColor: statusBg(b.status) },
                ]}
              >
                <Text
                  style={{
                    fontSize: 7,
                    fontWeight: 700,
                    color: statusColor(b.status),
                  }}
                >
                  {b.status}: {b.count}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Page>
  );
}

const rowAvailableH = 90;

function estimateRowHeight(note?: string | null, label?: string | null): number {
  const labelColW = IMAGE_W * 0.26;
  const labelCharsPerLine = Math.floor(labelColW / 5);
  const labelLines = label
    ? Math.max(1, ...label.split('\n').map(s => Math.ceil(s.length / Math.max(1, labelCharsPerLine))))
    : 0;

  const notesColW = IMAGE_W * 0.3;
  const notesCharsPerLine = Math.floor(notesColW / 4.2);
  let notesLines = 0;
  if (note) {
    const segments = note.split('\n');
    for (const seg of segments) {
      notesLines += Math.max(1, Math.ceil(seg.length / Math.max(1, notesCharsPerLine)));
    }
  }

  const labelH = labelLines * 12 + 13;
  const notesH = notesLines * 10 + 13;
  return Math.round(Math.max(25, labelH, notesH) * 1.2);
}

function chunkPins(pins: PinPDF[]): PinPDF[][] {
  if (pins.length === 0) return [[]];
  const chunks: PinPDF[][] = [];
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
  capture,
  pinsToShow,
  pinOffset,
  totalPins,
  pageNumber,
  totalPages,
}: {
  capture: CapturePDF;
  pinsToShow: PinPDF[];
  pinOffset: number;
  totalPins: number;
  pageNumber: number;
  totalPages: number;
}) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const allPins = capture.pins.map((p, i) => ({ ...p, number: i + 1 }));
  const visible = pinsToShow.map((p, i) => ({ ...p, number: pinOffset + i + 1 }));

  const imageAspect = capture.imageWidth / capture.imageHeight;
  const boxAspect = IMAGE_W / IMAGE_H;
  let renderW: number, renderH: number;
  if (imageAspect > boxAspect) {
    renderW = IMAGE_W;
    renderH = IMAGE_W / imageAspect;
  } else {
    renderH = IMAGE_H;
    renderW = IMAGE_H * imageAspect;
  }
  const offsetX = (IMAGE_W - renderW) / 2;
  const offsetY = (IMAGE_H - renderH) / 2;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {(capture.companyName || capture.companyLogoUrl) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {capture.companyLogoUrl && (
              <Image
                src={capture.companyLogoUrl}
                style={{ width: 32, height: 32, objectFit: "contain" }}
              />
            )}
            {capture.companyName && (
              <View>
                <Text style={styles.brandName}>{capture.companyName}</Text>
                {capture.companyAddress && (
                  <Text style={styles.brandSub}>{capture.companyAddress}</Text>
                )}
              </View>
            )}
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Observation Report</Text>
          <Text style={styles.metaValue}>{date}</Text>
        </View>
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
          {capture.title}
        </Text>
        <Text style={{ fontSize: 9, color: "#64748b", marginTop: 3, marginBottom: 2 }}>
          Project: {capture.projectTitle}
        </Text>
        {capture.clientName && (
          <Text style={{ fontSize: 8, color: "#94a3b8", marginBottom: 2 }}>
            Client: {capture.clientName}
            {capture.projectAddress ? ` · ${capture.projectAddress}` : ""}
          </Text>
        )}
        <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>
          {totalPins} observation{totalPins !== 1 ? "s" : ""} found
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Reference Image</Text>
      <View style={styles.sectionTitleLine} />
      <View style={styles.imageWrapper}>
        <Image style={styles.floorPlanImage} src={capture.imageUrl} />
        {allPins.map((pin) => (
          <View
            key={pin.id}
            style={[
              styles.dotNumber,
              {
                left: offsetX + pin.x * renderW - DOT_SIZE / 2,
                top: offsetY + pin.y * renderH - DOT_SIZE / 2,
                backgroundColor: severityColor(pin.severity),
              },
            ]}
          >
            <Text style={styles.dotNumberText}>{pin.number}</Text>
          </View>
        ))}
      </View>


      {totalPins > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            Observation Details{totalPages > 1 ? ` (Page ${pageNumber} of ${totalPages})` : ""}
          </Text>
          <View style={styles.sectionTitleLine} />
          <View style={styles.pinTable}>
            <View style={styles.tableHeader}>
              <Text style={[{ width: "8%" }, styles.tableHeaderCell]}>#</Text>
              <Text style={[{ width: "26%" }, styles.tableHeaderCell]}>Label</Text>
              <Text style={[{ width: "18%" }, styles.tableHeaderCell]}>Severity</Text>
              <Text style={[{ width: "18%" }, styles.tableHeaderCell]}>Status</Text>
              <Text style={[{ width: "30%" }, styles.tableHeaderCell]}>Recommendations</Text>
            </View>
            {visible.map((pin) => (
              <View key={pin.id} wrap={false} style={styles.tableRow}>
                <Text style={[{ width: "8%" }, styles.tableCell]}>{pin.number}</Text>
                <Text style={[{ width: "26%" }, styles.tableCell]}>
                  {pin.label}{pin.hasPhoto ? " 📷" : ""}
                </Text>
                <View style={{ width: "18%", flexDirection: "row", alignItems: "center" }}>
                  <View style={[styles.sevDot, { backgroundColor: severityColor(pin.severity) }]} />
                  <Text style={{ fontSize: 8, color: "#1e293b" }}>
                    {severityLabel(pin.severity)}
                  </Text>
                </View>
                <View style={{ width: "18%" }}>
                  {pin.status ? (
                    <Text style={[
                      styles.badge,
                      {
                        backgroundColor:
                          pin.status === "Open" ? "#fef2f2" :
                          pin.status === "Resolved" ? "#f0fdf4" :
                          "#fffbeb",
                        color:
                          pin.status === "Open" ? "#991b1b" :
                          pin.status === "Resolved" ? "#166534" :
                          "#92400e",
                      },
                    ]}>
                      {pin.status}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 7, color: "#94a3b8" }}>—</Text>
                  )}
                </View>
                <Text style={[{ width: "30%" }, styles.tableCellSmall]}>
                  {pin.notes ? pin.notes : "—"}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ flex: 1 }} />

      {pageNumber === 1 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Severity</Text>
          <View style={styles.sectionTitleLine} />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#dc2626" }]} />
              <Text style={styles.legendText}>Major</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#f97316" }]} />
              <Text style={styles.legendText}>Cosmetic</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
              <Text style={styles.legendText}>Minor</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
              <Text style={styles.legendText}>Info</Text>
            </View>
            <Text style={{ fontSize: 7, color: "#94a3b8", marginLeft: 4 }}>
              📷 = Evidence photo | Before/After shown for Resolved items
            </Text>
          </View>
        </>
      )}

      <View style={{ borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8, marginTop: 16, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 7, color: "#94a3b8" }}>
          {capture.companyName || "Workspace"}
          {capture.companyPhone ? ` · ${capture.companyPhone}` : ""}
        </Text>
        <Text style={{ fontSize: 7, color: "#94a3b8" }}>
          Report generated by ReportGen &copy; {new Date().getFullYear()}
        </Text>
      </View>
    </Page>
  );
}

function ResolutionEvidencePage({
  capture,
  resolvedPins,
  pageNumber,
  totalPages,
}: {
  capture: CapturePDF;
  resolvedPins: PinPDF[];
  pageNumber: number;
  totalPages: number;
}) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const count = resolvedPins.length;
  const imgH = count === 1 ? 340 : 220;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {(capture.companyName || capture.companyLogoUrl) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {capture.companyLogoUrl && (
              <Image
                src={capture.companyLogoUrl}
                style={{ width: 32, height: 32, objectFit: "contain" }}
              />
            )}
            {capture.companyName && (
              <View>
                <Text style={styles.brandName}>{capture.companyName}</Text>
                {capture.companyAddress && (
                  <Text style={styles.brandSub}>{capture.companyAddress}</Text>
                )}
              </View>
            )}
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Resolution Evidence</Text>
          <Text style={styles.metaValue}>{date}</Text>
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
          {capture.title}
        </Text>
        <Text style={{ fontSize: 9, color: "#64748b", marginTop: 3 }}>
          Project: {capture.projectTitle}
        </Text>
        {totalPages > 1 && (
          <Text style={{ fontSize: 8, color: "#94a3b8", marginTop: 2 }}>
            Page {pageNumber} of {totalPages}
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Resolution Evidence</Text>
      <View style={styles.sectionTitleLine} />

      {resolvedPins.map((pin, idx) => {
        const pinNumber = capture.pins.indexOf(pin) + 1;
        return (
          <View
            key={pin.id}
            style={{
              flexDirection: "row",
              gap: 16,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 6,
              padding: 12,
              marginBottom: idx < resolvedPins.length - 1 ? 12 : 0,
            }}
            wrap={false}
          >
            <View style={{ width: 140, justifyContent: "flex-start" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>
                  #{pinNumber}
                </Text>
                <Text style={[styles.badge, { backgroundColor: "#f0fdf4", color: "#166534" }]}>
                  Resolved
                </Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                {pin.label}
              </Text>
              {pin.notes && (
                <Text style={{ fontSize: 7, color: "#94a3b8", lineHeight: 11 }}>
                  {pin.notes}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, borderWidth: 1, borderColor: "#d1fae5", borderRadius: 4, overflow: "hidden" }}>
              <Image
                src={pin.resolvedPhoto!}
                style={{ width: "100%", height: imgH, objectFit: "contain", backgroundColor: "#f8fafc" }}
              />
            </View>
          </View>
        );
      })}

      <View style={{ flex: 1 }} />
      <View style={{ borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 7, color: "#94a3b8" }}>
          {capture.companyName || "Workspace"}
          {capture.companyPhone ? ` · ${capture.companyPhone}` : ""}
        </Text>
        <Text style={{ fontSize: 7, color: "#94a3b8" }}>
          Report generated by ReportGen &copy; {new Date().getFullYear()}
        </Text>
      </View>
    </Page>
  );
}

export default function CapturePDF({ captures, cover }: CapturePDFProps) {
  function chunkResolved(pins: PinPDF[]): PinPDF[][] {
    const chunks: PinPDF[][] = [];
    for (let i = 0; i < pins.length; i += 2) {
      chunks.push(pins.slice(i, i + 2));
    }
    return chunks.length > 0 ? chunks : [[]];
  }

  return (
    <Document>
      {cover && <CaptureCoverPage cover={cover} />}
      {captures.map((capture) => {
        const chunks = chunkPins(capture.pins);
        const resolvedPins = capture.pins.filter((p) => p.status === "Resolved" && p.resolvedPhoto);
        const resolvedChunks = chunkResolved(resolvedPins);
        let runningOffset = 0;
        const observationPages = chunks.map((chunk, i) => {
          const offset = runningOffset;
          runningOffset += chunk.length;
          return (
            <CapturePageContent
              key={`${capture.title}-obs-${i}`}
              capture={capture}
              pinsToShow={chunk}
              pinOffset={offset}
              totalPins={capture.pins.length}
              pageNumber={i + 1}
              totalPages={chunks.length}
            />
          );
        });

        const evidencePages = resolvedChunks.map((chunk, i) => (
          <ResolutionEvidencePage
            key={`${capture.title}-evidence-${i}`}
            capture={capture}
            resolvedPins={chunk}
            pageNumber={i + 1}
            totalPages={resolvedChunks.length}
          />
        ));

        return [...observationPages, ...evidencePages];
      })}
    </Document>
  );
}
