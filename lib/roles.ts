export const SALE_PARTNER_ROLE = "sale_partner";

export function normalizeRole(role?: string | null) {
  return String(role ?? "").trim().toLowerCase();
}

export function isSalePartnerRole(role?: string | null) {
  return [SALE_PARTNER_ROLE, "sales_partner", "sales_lead"].includes(normalizeRole(role));
}
