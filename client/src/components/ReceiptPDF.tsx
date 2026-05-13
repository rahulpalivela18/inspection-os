import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 16,
    marginBottom: 24,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1e293b",
  },
  brandSub: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  receiptMeta: {
    alignItems: "flex-end",
  },
  receiptLabel: {
    fontSize: 8,
    color: "#64748b",
    fontWeight: 600,
  },
  receiptValue: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  billToName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 4,
  },
  billToLine: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 2,
  },
  billToSection: {
    marginBottom: 24,
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 10,
  },
  tableCell: {
    fontSize: 10,
    color: "#1e293b",
  },
  tableFooter: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1e293b",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1e293b",
  },
  paidBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 24,
  },
  paidText: {
    fontSize: 10,
    color: "#166534",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

const PLAN_LABELS: Record<string, string> = {
  starter: "Up to 2 inspectors",
  pro: "Up to 9 inspectors",
  enterprise: "Unlimited inspectors",
};

const PLAN_PRICES: Record<string, string> = {
  starter: "5,000",
  pro: "8,000",
  enterprise: "15,000",
};

interface ReceiptPDFProps {
  workspaceName: string;
  workspaceEmail: string;
  workspaceAddress: string;
  workspaceId: string;
  plan: string;
}

export default function ReceiptPDF({
  workspaceName,
  workspaceEmail,
  workspaceAddress,
  workspaceId,
  plan,
}: ReceiptPDFProps) {
  const date = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const receiptNum = `#RCP-${workspaceId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>ReportGen</Text>
            <Text style={styles.brandSub}>Inspection Report Platform</Text>
          </View>
          <View style={styles.receiptMeta}>
            <Text style={styles.receiptLabel}>RECEIPT</Text>
            <Text style={styles.receiptValue}>{receiptNum}</Text>
            <Text style={styles.receiptValue}>{date}</Text>
          </View>
        </View>

        <View style={styles.billToSection}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.billToName}>{workspaceName}</Text>
          {workspaceAddress ? (
            <Text style={styles.billToLine}>{workspaceAddress}</Text>
          ) : null}
          <Text style={styles.billToLine}>{workspaceEmail}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Description</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1, textAlign: "right" }}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, flex: 2 }}>
              {planLabel} Plan — {PLAN_LABELS[plan] || ""}
            </Text>
            <Text style={{ ...styles.tableCell, flex: 1, textAlign: "right" }}>
              ₹{PLAN_PRICES[plan] || "0"}/month
            </Text>
          </View>
          <View style={styles.tableFooter}>
            <Text style={{ ...styles.totalLabel, flex: 2 }}>Total</Text>
            <Text style={{ ...styles.totalValue, flex: 1, textAlign: "right" }}>
              ₹{PLAN_PRICES[plan] || "0"}/month
            </Text>
          </View>
        </View>

        <View style={styles.paidBadge}>
          <Text style={styles.paidText}>Payment received. Thank you!</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ReportGen — Inspection Report Platform
          </Text>
        </View>
      </Page>
    </Document>
  );
}
