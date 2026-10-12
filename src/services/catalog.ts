// Catálogos de configuração do Hubsoft (tipos, situações, motivos…): mudam
// raramente, então ficam em memória pela sessão inteira.
import type { CatalogItem, CloseReason, TicketStatus } from "../model";
import type { HubsoftApi } from "./hubsoftApi";

const cache = new Map<string, Promise<unknown>>();

function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = cache.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const pending = load().catch((error: unknown) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending);
  return pending;
}

export const ticketTypes = (api: HubsoftApi) =>
  remember<CatalogItem[]>(`${api.url}|tipos-atendimento`, async () =>
    ((await api.ticketTypes()).tipos_atendimento ?? []).map((item) => ({ id: item.id_tipo_atendimento, label: item.descricao ?? `Tipo ${item.id_tipo_atendimento}` })),
  );

export const ticketStatuses = (api: HubsoftApi) =>
  remember<TicketStatus[]>(`${api.url}|status-atendimento`, async () =>
    ((await api.ticketStatuses()).status_atendimento ?? []).map((item) => ({
      id: item.id_atendimento_status,
      label: item.display ?? item.descricao ?? `Situação ${item.id_atendimento_status}`,
      key: item.prefixo ?? "",
      opensOrder: item.abrir_ordem_servico === true,
    })),
  );

export const contactOrigins = (api: HubsoftApi) =>
  remember<CatalogItem[]>(`${api.url}|origens-contato`, async () =>
    ((await api.contactOrigins()).origem_contatos ?? []).map((item) => ({ id: item.id_origem_contato, label: item.descricao ?? `Origem ${item.id_origem_contato}` })),
  );

export const closeReasons = (api: HubsoftApi) =>
  remember<CloseReason[]>(`${api.url}|motivos-fechamento`, async () =>
    ((await api.closeReasons()).motivos_fechamento ?? []).map((item) => ({
      id: item.id_motivo_fechamento_atendimento,
      label: item.descricao ?? `Motivo ${item.id_motivo_fechamento_atendimento}`,
      ticketTypeIds: (item.motivos_fechamento_tipo_atendimento ?? []).map((type) => type.id_tipo_atendimento),
    })),
  );

/** Origem de contato "WhatsApp" cadastrada no Hubsoft, se existir. */
export async function whatsappOriginId(api: HubsoftApi): Promise<number | null> {
  try {
    const origins = await contactOrigins(api);
    return origins.find((item) => item.label.toLowerCase().includes("whats"))?.id ?? null;
  } catch {
    return null;
  }
}
