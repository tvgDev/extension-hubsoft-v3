const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 99.9 → "R$ 99,90"; null → "—". */
export const formatMoney = (value: number | null | undefined) => (value === null || value === undefined ? "—" : money.format(value));

export const digitsOnly = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");

/** "+55 71 99999-1234" → "71999991234", o formato DDNNNNNNNNN que o Hubsoft espera. */
export function phoneDigits(value: string | null | undefined): string {
  const digits = digitsOnly(value);
  return (digits.length === 12 || digits.length === 13) && digits.startsWith("55") ? digits.slice(2) : digits;
}

/** Número vindo da API como number, string com vírgula ou vazio. */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMegabytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
  return `${mb.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} MB`;
}

/** Data local no formato YYYY-MM-DD que a API do Hubsoft usa nos filtros. */
export function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Formata YYYY-MM-DD para DD/MM/YYYY. */
export function formatBrDate(isoDateStr: string): string {
  if (!isoDateStr) return "";
  const [year, month, day] = isoDateStr.split("-");
  if (!year || !month || !day) return isoDateStr;
  return `${day}/${month}/${year}`;
}

export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/** Diferença em dias entre duas datas YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000);
}
