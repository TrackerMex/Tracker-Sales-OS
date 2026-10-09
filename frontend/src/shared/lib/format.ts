export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  // Whole amounts stay compact; cents are shown only when the value has them.
  const digits = Number.isInteger(value) ? 0 : 2;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value) > 999999999 ? 999999999 : value);
}
