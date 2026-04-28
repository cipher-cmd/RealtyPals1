export function formatPriceCr(price: number): string {
  const value = Number(price);
  if (!Number.isFinite(value)) return '₹0.00 Cr';
  const crValue = value / 10000000;
  return `₹${crValue.toFixed(2)} Cr`;
}

export function formatPriceInrCompact(price: number): string {
  return formatPriceCr(price);
}
