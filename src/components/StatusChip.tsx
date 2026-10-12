import Chip from "@mui/material/Chip";
import { invoiceStatusColor, serviceStatusColor, statusLabel } from "../status";

/** Chip pequeno de situação, nas cores do painel (verde ativo, âmbar pendência). */
export function StatusChip({ kind, status }: { kind: "service" | "invoice"; status: string | null }) {
  if (!status) return <Chip size="small" label="Sem situação" />;
  const color = kind === "service" ? serviceStatusColor(status) : invoiceStatusColor(status);
  return <Chip size="small" color={color} label={statusLabel(status)} />;
}
