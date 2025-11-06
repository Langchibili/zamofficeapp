const symbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  ZAR: "R",
  ZMW: "ZK",
  NGN: "₦",
  GHS: "₵",
  KES: "KSh",
  TZS: "TSh",
  UGX: "USh",
  XOF: "CFA",
  XAF: "CFA",
  EGP: "E£",
  MAD: "DH",
};

export function formatCurrency(amount: number, code: string) {
  const sym = symbols[code] || code + " ";
  try {
    if (code !== "XOF" && code !== "XAF") {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(amount);
    }
  } catch {}
  return `${sym}${amount.toFixed(2)}`;
}
