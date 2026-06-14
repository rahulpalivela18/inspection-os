import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const PAGE_PADDING = 36;
const PAGE_W = 595.28;
const IMAGE_W = PAGE_W - PAGE_PADDING * 2;
const IMAGE_H = 280;
const DOT_SIZE = 10;

function severityColor(severity?: string) {
  switch (severity) {
    case "Critical": return "#dc2626";
    case "Major": return "#f97316";
    case "Minor": return "#eab308";
    default: return "#3b82f6";
  }
}

function severityLabel(severity?: string) {
  return severity || "Info";
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
    borderBottomWidth: 1.5,
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
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
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
    alignItems: "center",
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
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    marginTop: 24,
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
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
}

interface CapturePDF {
  projectTitle: string;
  title: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  pins: PinPDF[];
}

interface CapturePDFProps {
  captures: CapturePDF[];
}

function CapturePage({ capture }: { capture: CapturePDF }) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const pins = capture.pins.map((p, i) => ({ ...p, number: i + 1 }));

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
        <View>
          <Text style={styles.brandName}>ReportGen</Text>
          <Text style={styles.brandSub}>Inspection Report Platform</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>Capture Report</Text>
          <Text style={styles.metaValue}>{date}</Text>
        </View>
      </View>

      <View>
        <Text style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
          {capture.title}
        </Text>
        <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2, marginBottom: 4 }}>
          Project: {capture.projectTitle} &middot; {pins.length} hotspot{pins.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Reference Map</Text>
      <View style={styles.imageWrapper}>
        <Image style={styles.floorPlanImage} src={capture.imageUrl} />
        {pins.map((pin) => (
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
      <Text style={styles.imageCaption}>
        {pins.length} hotspot{pins.length !== 1 ? "s" : ""} marked on the image
      </Text>

      {pins.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Hotspot Details</Text>
          <View style={styles.pinTable}>
            <View style={styles.tableHeader}>
              <Text style={[{ width: "8%" }, styles.tableHeaderCell]}>#</Text>
              <Text style={[{ width: "26%" }, styles.tableHeaderCell]}>Label</Text>
              <Text style={[{ width: "18%" }, styles.tableHeaderCell]}>Severity</Text>
              <Text style={[{ width: "18%" }, styles.tableHeaderCell]}>Status</Text>
              <Text style={[{ width: "30%" }, styles.tableHeaderCell]}>Notes</Text>
            </View>
            {pins.map((pin) => (
              <View key={pin.id} style={styles.tableRow}>
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
                  {pin.notes
                    ? (pin.notes.length > 40 ? pin.notes.slice(0, 40) + "..." : pin.notes)
                    : "—"}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Severity Legend</Text>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#dc2626" }]} />
          <Text style={styles.legendText}>Critical</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#f97316" }]} />
          <Text style={styles.legendText}>Major</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#eab308" }]} />
          <Text style={styles.legendText}>Minor</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
          <Text style={styles.legendText}>Info</Text>
        </View>
        <Text style={{ fontSize: 7, color: "#94a3b8", marginLeft: 4 }}>
          📷 = Evidence photo attached
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ReportGen — Inspection Report Platform
        </Text>
      </View>
    </Page>
  );
}

export default function CapturePDF({ captures }: CapturePDFProps) {
  return (
    <Document>
      {captures.map((capture) => (
        <CapturePage key={capture.title} capture={capture} />
      ))}
    </Document>
  );
}
