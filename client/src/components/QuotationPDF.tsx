import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const PAGE_PADDING = 40;
const PRIMARY = "#4f46e5";

const styles = StyleSheet.create({
  page: { padding: PAGE_PADDING, fontSize: 10, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
    paddingBottom: 14,
    marginBottom: 20,
  },
  brandName: { fontSize: 18, fontWeight: 700, color: PRIMARY },
  brandSub: { fontSize: 8, color: "#64748b", marginTop: 2 },
  meta: { alignItems: "flex-end" },
  metaLabel: {
    fontSize: 7,
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: { fontSize: 9, color: "#1e293b", marginTop: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 8,
    marginTop: 16,
  },
  infoRow: { flexDirection: "row", marginBottom: 4 },
  infoLabel: { width: 100, fontSize: 9, color: "#64748b", fontWeight: 600 },
  infoValue: { flex: 1, fontSize: 9, color: "#1e293b" },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderText: { color: "#ffffff", fontSize: 8, fontWeight: 700 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  colNo: { width: 30 },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: "center" },
  colUnit: { width: 50, textAlign: "center" },
  colRate: { width: 80, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  totals: { marginTop: 12, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", marginBottom: 4 },
  totalLabel: { width: 100, textAlign: "right", fontSize: 9, color: "#64748b" },
  totalValue: { width: 80, textAlign: "right", fontSize: 9, color: "#1e293b" },
  grandTotalLabel: {
    width: 100,
    textAlign: "right",
    fontSize: 11,
    fontWeight: 700,
    color: "#1e293b",
  },
  grandTotalValue: {
    width: 80,
    textAlign: "right",
    fontSize: 11,
    fontWeight: 700,
    color: PRIMARY,
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  notesLabel: { fontSize: 8, fontWeight: 700, color: "#64748b", marginBottom: 4 },
  notesText: { fontSize: 9, color: "#475569", lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: PAGE_PADDING,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    fontSize: 7,
    color: "#94a3b8",
  },
});

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface QuotationPDFProps {
  quotation: any;
  items: any[];
  project: any;
  workspace: any;
}

export default function QuotationPDF({
  quotation,
  items,
  project,
  workspace,
}: QuotationPDFProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.estimatedCost) || 0) * (item.quantity || 1),
    0,
  );
  const taxRate = Number(quotation.taxRate) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{workspace?.name || "ReportGen"}</Text>
            <Text style={styles.brandSub}>Inspection Quotation</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Quotation</Text>
            <Text style={styles.metaValue}>{quotation.title}</Text>
            <Text style={[styles.metaLabel, { marginTop: 6 }]}>Date</Text>
            <Text style={styles.metaValue}>
              {new Date(quotation.createdAt).toLocaleDateString("en-IN")}
            </Text>
            <Text style={[styles.metaLabel, { marginTop: 6 }]}>Status</Text>
            <Text style={styles.metaValue}>{quotation.status}</Text>
          </View>
        </View>

        {/* Client Details */}
        {(quotation.clientName || quotation.clientPhone || quotation.clientEmail) && (
          <>
            <Text style={styles.sectionTitle}>Client Details</Text>
            {quotation.clientName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{quotation.clientName}</Text>
              </View>
            )}
            {quotation.clientPhone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{quotation.clientPhone}</Text>
              </View>
            )}
            {quotation.clientEmail && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{quotation.clientEmail}</Text>
              </View>
            )}
          </>
        )}

        {/* Property Details */}
        {(quotation.propertyAddress || quotation.propertyType || quotation.bedrooms || quotation.bathrooms || quotation.areaSqFt) && (
          <>
            <Text style={styles.sectionTitle}>Property Details</Text>
            {quotation.propertyAddress && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{quotation.propertyAddress}</Text>
              </View>
            )}
            {quotation.propertyType && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{quotation.propertyType}</Text>
              </View>
            )}
            {(quotation.bedrooms || quotation.bathrooms || quotation.areaSqFt) && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Specs</Text>
                <Text style={styles.infoValue}>
                  {[
                    quotation.bedrooms && `${quotation.bedrooms} BR`,
                    quotation.bathrooms && `${quotation.bathrooms} Bath`,
                    quotation.areaSqFt && `${quotation.areaSqFt} sq ft`,
                  ]
                    .filter(Boolean)
                    .join("  |  ")}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Line Items Table */}
        <Text style={styles.sectionTitle}>Quotation Items</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNo]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>
          {items.map((item, i) => {
            const amount = (Number(item.estimatedCost) || 0) * (item.quantity || 1);
            return (
              <View
                key={item.id}
                style={[styles.tableRow, ...(i % 2 === 1 ? [styles.tableRowAlt] : [])]}
              >
                <Text style={styles.colNo}>{i + 1}</Text>
                <Text style={styles.colDesc}>{item.label}</Text>
                <Text style={styles.colQty}>{item.quantity || 1}</Text>
                <Text style={styles.colUnit}>{item.unit || "nos"}</Text>
                <Text style={styles.colRate}>{formatCurrency(Number(item.estimatedCost) || 0)}</Text>
                <Text style={styles.colAmount}>{formatCurrency(amount)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          {taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST ({taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { marginTop: 4, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 6 }]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quotation.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes & Terms</Text>
            <Text style={styles.notesText}>{quotation.notes}</Text>
          </View>
        )}

        {/* Validity */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 8, color: "#64748b" }}>
            This quotation is valid for {quotation.validityDays || 30} days from the date of issue.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{workspace?.name}</Text>
          <Text>Generated by ReportGen</Text>
        </View>
      </Page>
    </Document>
  );
}
