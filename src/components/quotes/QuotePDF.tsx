import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Quote, QuoteLineItemData } from "@/lib/db/schema/quotes";
import type { Company } from "@/lib/db/schema/companies";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDollars(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function fmtDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const UNIT_LABELS: Record<string, string> = {
  sqft: "sq ft",
  lf: "lin ft",
  hr: "hr",
  flat: "flat",
  ea: "ea",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a2e",
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    backgroundColor: "#ffffff",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  businessName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0F1628",
    marginBottom: 3,
  },
  headerMeta: {
    fontSize: 8.5,
    color: "#64748b",
    marginBottom: 2,
  },
  quoteLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "right",
    marginBottom: 2,
  },
  quoteNumber: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0F1628",
    textAlign: "right",
    marginBottom: 4,
  },
  quoteDateText: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "right",
    marginBottom: 1,
  },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 20,
  },

  // Prepared for
  prepLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  prepName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0F1628",
    marginBottom: 2,
  },
  prepMeta: {
    fontSize: 8.5,
    color: "#64748b",
    marginBottom: 1,
  },

  // Line items
  itemsSection: {
    marginTop: 24,
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 5,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F1628",
    marginBottom: 1,
  },
  itemDesc: {
    fontSize: 8,
    color: "#94a3b8",
    marginBottom: 1,
  },
  itemCalc: {
    fontSize: 8,
    color: "#94a3b8",
  },
  itemTotal: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F1628",
    textAlign: "right",
  },

  // Columns
  colDescription: { flex: 1 },
  colTotal: { width: 72, textAlign: "right" },

  // Totals
  totalsSection: {
    marginTop: 16,
    marginLeft: "auto",
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  totalValue: {
    fontSize: 9,
    color: "#64748b",
  },
  discountValue: {
    fontSize: 9,
    color: "#16a34a",
  },
  grandTotalDivider: {
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    marginVertical: 6,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0F1628",
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0F1628",
  },

  // Message + deposit
  messageSection: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
  },
  messageText: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.6,
  },
  depositBox: {
    marginTop: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 4,
    padding: 10,
  },
  depositText: {
    fontSize: 8.5,
    color: "#c2410c",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  quote: Quote;
  company: Company;
  homeownerName: string;
  homeownerPhone?: string | null;
  homeownerEmail?: string | null;
  homeownerAddress?: string | null;
}

export function QuotePDF({ quote, company, homeownerName, homeownerPhone, homeownerEmail, homeownerAddress }: Props) {
  const lineItems = quote.lineItems as QuoteLineItemData[];

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.businessName}>{company.businessName}</Text>
            {company.businessPhone && <Text style={s.headerMeta}>{company.businessPhone}</Text>}
            {company.businessEmail && <Text style={s.headerMeta}>{company.businessEmail}</Text>}
            {company.websiteUrl && <Text style={s.headerMeta}>{company.websiteUrl}</Text>}
          </View>
          <View>
            <Text style={s.quoteLabel}>Quote</Text>
            <Text style={s.quoteNumber}>{quote.quoteNumber}</Text>
            <Text style={s.quoteDateText}>Issued {fmtDate(quote.issueDate)}</Text>
            <Text style={s.quoteDateText}>Valid until {fmtDate(quote.validUntil)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Prepared for ── */}
        <View>
          <Text style={s.prepLabel}>Prepared for</Text>
          <Text style={s.prepName}>{homeownerName}</Text>
          {homeownerAddress && <Text style={s.prepMeta}>{homeownerAddress}</Text>}
          {homeownerPhone && <Text style={s.prepMeta}>{homeownerPhone}</Text>}
          {homeownerEmail && <Text style={s.prepMeta}>{homeownerEmail}</Text>}
        </View>

        {/* ── Line items ── */}
        {lineItems.length > 0 && (
          <View style={s.itemsSection}>
            <View style={s.tableHeader}>
              <View style={s.colDescription}>
                <Text style={s.tableHeaderText}>Description</Text>
              </View>
              <View style={s.colTotal}>
                <Text style={[s.tableHeaderText, { textAlign: "right" }]}>Total</Text>
              </View>
            </View>

            {lineItems.map((item) => {
              const qty = parseFloat(item.quantity) || 0;
              const price = parseFloat(item.unitPrice) || 0;
              const hasCalc = qty > 0 && price > 0 && item.unit !== "flat";
              return (
                <View key={item.id} style={s.tableRow}>
                  <View style={s.colDescription}>
                    <Text style={s.itemName}>{item.name}</Text>
                    {item.description ? <Text style={s.itemDesc}>{item.description}</Text> : null}
                    {hasCalc && (
                      <Text style={s.itemCalc}>
                        {item.quantity} {UNIT_LABELS[item.unit] ?? item.unit} × ${price.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  <View style={s.colTotal}>
                    <Text style={s.itemTotal}>
                      {item.totalCents > 0 ? fmtDollars(item.totalCents) : "—"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Totals ── */}
        <View style={s.totalsSection}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{fmtDollars(quote.subtotalCents)}</Text>
          </View>
          {quote.discountCents > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>
                Discount{quote.discountType === "percent" ? ` (${(quote.discountCents / quote.subtotalCents * 100).toFixed(0)}%)` : ""}
              </Text>
              <Text style={s.discountValue}>− {fmtDollars(quote.discountCents)}</Text>
            </View>
          )}
          {quote.taxCents > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Tax ({(quote.taxRateBps / 100).toFixed(2)}%)</Text>
              <Text style={s.totalValue}>{fmtDollars(quote.taxCents)}</Text>
            </View>
          )}
          <View style={s.grandTotalDivider} />
          <View style={s.totalRow}>
            <Text style={s.grandTotalLabel}>Total</Text>
            <Text style={s.grandTotalValue}>{fmtDollars(quote.totalCents)}</Text>
          </View>
        </View>

        {/* ── Message + deposit ── */}
        {(quote.homeownerMessage || quote.depositNote) && (
          <View style={s.messageSection}>
            {quote.homeownerMessage && (
              <Text style={s.messageText}>{quote.homeownerMessage}</Text>
            )}
            {quote.depositNote && (
              <View style={s.depositBox}>
                <Text style={s.depositText}>{quote.depositNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{company.businessName} · {quote.quoteNumber}</Text>
          <Text style={s.footerText}>Valid until {fmtDate(quote.validUntil)}</Text>
        </View>

      </Page>
    </Document>
  );
}
