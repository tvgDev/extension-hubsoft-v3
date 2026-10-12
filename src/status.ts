// Leitura das situações que o Hubsoft devolve (serviço, fatura, chamado, OS, conexão, CPE, nota).

export type StatusColor = "success" | "warning" | "error" | "info" | "default";
export type StatusKind = "service" | "invoice" | "ticket" | "order" | "connection" | "cpe" | "note";

const UNLOCKABLE = ["suspenso_debito", "suspenso_parcialmente", "suspenso", "bloqueado"];

/** Serviço suspenso por débito: cabe desbloqueio em confiança. */
export const needsUnlock = (statusKey: string | null) => statusKey !== null && UNLOCKABLE.includes(statusKey.toLowerCase());

export const isPaid = (status: string) => ["pago", "liquidado", "quitado"].includes(status.toLowerCase());

export function statusColor(kind: StatusKind, status: string): StatusColor {
  const value = status.toLowerCase().trim();
  switch (kind) {
    case "service":
      if (value === "servico_habilitado" || value === "ativo" || value.includes("habilitado")) return "success";
      if (value === "suspenso_pedido_cliente") return "info";
      if (needsUnlock(value) || value.includes("suspenso") || value.includes("bloqueado") || value === "franquia_excedida") return "warning";
      if (value.includes("cancelad")) return "error";
      if (value.startsWith("aguardando") || value.startsWith("agendado")) return "info";
      return "default";
    case "invoice":
      if (isPaid(value)) return "success";
      if (value.includes("cancelad")) return "default";
      if (value.startsWith("vencid")) return "error";
      return "warning";
    case "ticket":
      return value === "aberto" ? "warning" : "success";
    case "order":
      if (value === "finalizado" || value === "concluido") return "success";
      if (value === "aguardando_agendamento") return "warning";
      if (value === "pendente") return "info";
      if (value.includes("cancelad")) return "error";
      return "default";
    case "connection":
      if (value === "conectado") return "success";
      if (value === "desconectado") return "error";
      return "default";
    case "cpe":
      if (["working", "online", "up", "ativo"].includes(value)) return "success";
      if (!value) return "default";
      return "error";
    case "note":
      if (["autorizado", "autorizada", "efetivada", "normal"].includes(value)) return "success";
      if (value.includes("cancelad")) return "error";
      return "default";
  }
}

/** "suspenso_parcialmente" → "Suspenso parcialmente". */
export function statusLabel(status: string): string {
  const text = status.replace(/_/g, " ").trim().toLowerCase();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "—";
}

/** Sinal óptico recebido pela ONU, em dBm: acima de -27 está bom, até -30 é limite, abaixo é problema. */
export function signalColor(dbm: number | null): StatusColor {
  if (dbm === null) return "default";
  if (dbm > -27) return "success";
  if (dbm > -30) return "warning";
  return "error";
}
