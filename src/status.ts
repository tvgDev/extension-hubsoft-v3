// Leitura das situações que o Hubsoft devolve (serviço e fatura).

const UNLOCKABLE = ["suspenso", "bloqueado", "suspenso_parcialmente"];

/** Serviço bloqueado por falta de pagamento: cabe desbloqueio em confiança. */
export const needsUnlock = (status: string | null) => status !== null && UNLOCKABLE.includes(status.toLowerCase());

export const isPaid = (status: string) => ["pago", "liquidado"].includes(status.toLowerCase());

export type StatusColor = "success" | "warning" | "error" | "default";

export function serviceStatusColor(status: string): StatusColor {
  const value = status.toLowerCase();
  if (value === "ativo") return "success";
  if (needsUnlock(value)) return "warning";
  if (value === "cancelado") return "error";
  return "default";
}

export function invoiceStatusColor(status: string): StatusColor {
  const value = status.toLowerCase();
  if (isPaid(value)) return "success";
  if (value === "cancelado") return "default";
  if (value.startsWith("vencid")) return "error";
  return "warning";
}

/** "suspenso_parcialmente" → "Suspenso parcialmente". */
export function statusLabel(status: string): string {
  const text = status.replace(/_/g, " ").trim().toLowerCase();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "—";
}
