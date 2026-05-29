interface LineItem {
  id: string;
  sortOrder: number;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalCents: number;
}

export function recalculateTotals(
  lineItems: LineItem[],
  discountType: string | null,
  discountCents: number,
  taxRateBps: number
) {
  // Recalculate each line item's total from quantity × unitPrice
  const recalcedItems = lineItems.map((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return { ...item, totalCents: Math.round(qty * price * 100) };
  });

  const subtotalCents = recalcedItems.reduce((sum, item) => sum + item.totalCents, 0);

  // Clamp discount so total never goes negative
  const clampedDiscount = Math.min(Math.max(discountCents ?? 0, 0), subtotalCents);

  const taxCents = Math.round((subtotalCents - clampedDiscount) * (taxRateBps ?? 0) / 10000);
  const totalCents = subtotalCents - clampedDiscount + taxCents;

  return {
    lineItems: recalcedItems,
    subtotalCents,
    discountType: discountType ?? null,
    discountCents: clampedDiscount,
    taxRateBps: taxRateBps ?? 0,
    taxCents,
    totalCents,
  };
}
