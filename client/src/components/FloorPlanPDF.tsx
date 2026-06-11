import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 36,
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
  floorPlanImage: {
    width: "100%",
    height: 280,
    objectFit: "contain",
    marginBottom: 4,
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
    paddingVertical: 8,
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
  badge: {
    fontSize: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 2,
  },
  qrCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 36,
    height: 36,
  },
});

interface PinPDF {
  id: string;
  label: string;
  x: number;
  y: number;
  panoUrl?: string;
  qrDataUrl?: string;
  issueTitle?: string;
  issueStatus?: string;
  issueSeverity?: string;
  notes?: string;
}

interface FloorPlanPDFProps {
  projectTitle: string;
  floorPlanTitle: string;
  floorPlanImageUrl: string;
  pins: PinPDF[];
}

function getStatusBadgeColor(status?: string) {
  switch (status) {
    case "Open": return { bg: "#fef2f2", color: "#991b1b" };
    case "Resolved": return { bg: "#f0fdf4", color: "#166534" };
    case "In Progress": return { bg: "#fffbeb", color: "#92400e" };
    default: return { bg: "#f1f5f9", color: "#475569" };
  }
}

function getSeverityColor(severity?: string) {
  switch (severity) {
    case "Critical": return "#dc2626";
    case "Major": return "#ea580c";
    case "Minor": return "#ca8a04";
    default: return "#64748b";
  }
}

export default function FloorPlanPDF({
  projectTitle,
  floorPlanTitle,
  floorPlanImageUrl,
  pins,
}: FloorPlanPDFProps) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const numberedPins = pins.map((pin, i) => ({ ...pin, number: i + 1 }));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>ReportGen</Text>
            <Text style={styles.brandSub}>Inspection Report Platform</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Floor Plan Report</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
            {floorPlanTitle}
          </Text>
          <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2, marginBottom: 4 }}>
            Project: {projectTitle} &middot; {pins.length} pin{pins.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reference Map</Text>
        <Image style={styles.floorPlanImage} src={floorPlanImageUrl} />
        <Text style={styles.imageCaption}>
          Floor plan with {pins.length} inspection pin{pins.length !== 1 ? "s" : ""}
        </Text>

        {numberedPins.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pin Details</Text>
            <View style={styles.pinTable}>
              <View style={styles.tableHeader}>
                <Text style={[{ width: "8%" }, styles.tableHeaderCell]}>#</Text>
                <Text style={[{ width: "22%" }, styles.tableHeaderCell]}>Label</Text>
                <Text style={[{ width: "13%" }, styles.tableHeaderCell]}>Position</Text>
                <Text style={[{ width: "23%" }, styles.tableHeaderCell]}>Linked Issue</Text>
                <Text style={[{ width: "20%" }, styles.tableHeaderCell]}>Notes</Text>
                <Text style={[{ width: "14%", textAlign: "center" }, styles.tableHeaderCell]}>360 View</Text>
              </View>
              {numberedPins.map((pin) => (
                <View key={pin.id} style={styles.tableRow}>
                  <Text style={[{ width: "8%" }, styles.tableCell]}>{pin.number}</Text>
                  <Text style={[{ width: "22%" }, styles.tableCell]}>{pin.label}</Text>
                  <Text style={[{ width: "13%" }, styles.tableCellSmall]}>
                    {(pin.x * 100).toFixed(1)}% × {(pin.y * 100).toFixed(1)}%
                  </Text>
                  <View style={{ width: "23%", flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
                    {pin.issueTitle ? (
                      <>
                        <Text style={{ fontSize: 8, color: "#1e293b" }}>{pin.issueTitle}</Text>
                        <Text style={[styles.badge, { backgroundColor: getStatusBadgeColor(pin.issueStatus).bg, color: getStatusBadgeColor(pin.issueStatus).color }]}>
                          {pin.issueStatus || "Open"}
                        </Text>
                        <Text style={{ fontSize: 6, color: getSeverityColor(pin.issueSeverity), marginLeft: 2 }}>
                          {pin.issueSeverity}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: 7, color: "#94a3b8" }}>—</Text>
                    )}
                  </View>
                  <Text style={[{ width: "20%" }, styles.tableCellSmall]}>
                    {pin.notes
                      ? (pin.notes.length > 35 ? pin.notes.slice(0, 35) + "..." : pin.notes)
                      : "—"}
                  </Text>
                  <View style={[{ width: "14%" }, styles.qrCell]}>
                    {pin.qrDataUrl && pin.panoUrl && (
                      <Image style={styles.qrImage} src={pin.qrDataUrl} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 12, marginTop: 24 }}>
          <Text style={{ fontSize: 7, color: "#94a3b8", textAlign: "center" }}>
            ReportGen — Inspection Report Platform &middot; PINs are percentage-based coordinates (0–100%)
          </Text>
        </View>
      </Page>
    </Document>
  );
}
