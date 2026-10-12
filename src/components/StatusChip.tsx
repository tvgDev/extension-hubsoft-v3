import Chip from "@mui/material/Chip";
import { statusColor, statusLabel, type StatusKind } from "../status";

/** Chip pequeno de situação, nas cores do painel (verde ok, âmbar pendência, vermelho problema). */
export function StatusChip({ kind, status, label }: { kind: StatusKind; status: string | null; label?: string }) {
  if (!status) return <Chip size="small" label={label ?? "Sem situação"} />;
  return <Chip size="small" color={statusColor(kind, status)} label={label ?? statusLabel(status)} />;
}
