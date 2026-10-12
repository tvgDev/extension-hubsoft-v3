// Tradução dos formatos do Hubsoft para os tipos do módulo, tolerante a campos ausentes.
import { toNumber } from "../format";
import type {
  Address,
  Connection,
  ConnectionHistory,
  Cpe,
  FiscalNote,
  HubsoftClient,
  Invoice,
  Plan,
  Prospect,
  Service,
  ServiceOrder,
  Ticket,
  Viability,
} from "../model";
import type {
  RawAddress,
  RawClient,
  RawConnection,
  RawConnectionRecord,
  RawCpe,
  RawFiscalNotes,
  RawInvoice,
  RawPlan,
  RawProspect,
  RawService,
  RawServiceOrder,
  RawTicket,
  RawViability,
} from "./hubsoftApi";

const text = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

export function toAddress(raw: RawAddress | null | undefined): Address | null {
  if (!raw) return null;
  const street = text([raw.logradouro, raw.endereco].filter(Boolean).join(" "));
  const full = text(raw.completo) ?? [street, raw.numero, raw.bairro, raw.cidade && raw.estado ? `${raw.cidade}/${raw.estado}` : raw.cidade].filter(Boolean).join(", ");
  if (!full) return null;
  return {
    full,
    street,
    number: text(raw.numero),
    complement: text(raw.complemento),
    district: text(raw.bairro),
    city: text(raw.cidade),
    state: text(raw.estado),
    cep: text(raw.cep),
  };
}

function toConnection(raw: RawConnection | null | undefined): Connection | null {
  if (!raw) return null;
  return {
    online: raw.conectado === true,
    statusText: text(raw.status_txt_resumido) ?? text(raw.status_txt),
    lastConnection: text(raw.ultima_conexao),
    lastDisconnection: text(raw.ultima_desconexao),
    lastIp: text(raw.ultimo_ipv4),
    nasIp: text(raw.ultimo_nas_ip),
  };
}

export function toService(raw: RawService): Service {
  return {
    id: raw.id_cliente_servico,
    planNumber: raw.numero_plano ?? null,
    name: text(raw.nome) ?? "Serviço",
    value: toNumber(raw.valor),
    status: text(raw.status) ?? "",
    statusKey: text(raw.status_prefixo) ?? "",
    technology: text(raw.tecnologia),
    download: text(raw.velocidade_download),
    upload: text(raw.velocidade_upload),
    login: text(raw.login),
    password: text(raw.senha),
    ipv4: text(raw.ipv4),
    macAddr: text(raw.mac_addr),
    phyAddr: text(raw.phy_addr),
    installAddress: toAddress(raw.endereco_instalacao),
    connection: toConnection(raw.ultima_conexao),
    olt: text(raw.equipamento_conexao?.nome),
    oltInterface: text(raw.interface?.nome),
    concentrator: text(raw.equipamento_roteamento?.nome),
    passwords: (raw.senhas ?? []).map((item) => ({
      id: item.id_cliente_servico_senha,
      description: text(item.descricao) ?? "Senha",
      user: text(item.usuario),
      password: text(item.senha),
    })),
  };
}

const alertText = (item: unknown): string | null => {
  if (typeof item === "string") return text(item);
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    return text(record.mensagem) ?? text(record.descricao) ?? text(record.titulo);
  }
  return null;
};

export function toClient(raw: RawClient): HubsoftClient {
  return {
    id: raw.id_cliente,
    code: raw.codigo_cliente ?? null,
    name: raw.nome_razaosocial,
    document: raw.cpf_cnpj,
    personType: text(raw.tipo_pessoa),
    phone: text(raw.telefone_primario),
    email: text(raw.email_principal),
    alerts: (raw.alerta_mensagens ?? []).map(alertText).filter((item): item is string => item !== null),
    services: (raw.servicos ?? []).map(toService),
  };
}

export function toInvoice(raw: RawInvoice, index: number): Invoice {
  const status = text(raw.status) ?? "";
  const paidAt = text(raw.data_pagamento);
  return {
    id: raw.id_fatura !== undefined && raw.id_fatura !== null ? String(raw.id_fatura) : `fatura-${index}`,
    dueDate: text(raw.data_vencimento) ?? "—",
    value: toNumber(raw.valor) ?? 0,
    paidValue: toNumber(raw.valor_pago),
    status: raw.quitado ? "pago" : status,
    paid: raw.quitado === true || ["pago", "liquidado", "quitado"].includes(status.toLowerCase()) || paidAt !== null,
    pix: text(raw.pix_copia_cola),
    barcode: text(raw.linha_digitavel),
    pdfUrl: text(raw.link),
    paidAt,
    serviceName: text(raw.cliente?.servico?.nome),
    lines: (raw.detalhamento ?? []).map((line) => ({ description: text(line.descricao) ?? "", value: toNumber(line.valor) ?? 0 })),
  };
}

export function toServiceOrder(raw: RawServiceOrder): ServiceOrder {
  return {
    id: raw.id_ordem_servico,
    number: text(raw.numero_ordem_servico) ?? String(raw.id_ordem_servico),
    type: text(raw.tipo) ?? "Ordem de serviço",
    status: text(raw.status) ?? "",
    closeStatus: text(raw.status_fechamento),
    createdAt: text(raw.data_cadastro),
    scheduledStart: text(raw.data_inicio_programado),
    scheduledEnd: text(raw.data_termino_programado),
    executedStart: text(raw.data_inicio_executado),
    executedEnd: text(raw.data_termino_executado),
    openingDescription: text(raw.descricao_abertura),
    serviceDescription: text(raw.descricao_servico),
    closingDescription: text(raw.descricao_fechamento),
    openedBy: text(raw.usuario_abertura),
  };
}

export function toTicket(raw: RawTicket): Ticket {
  const closedAt = text(raw.data_fechamento);
  const messages = raw.atendimento_mensagem ?? raw.mensagens ?? [];
  return {
    id: raw.id_atendimento,
    protocol: text(raw.protocolo) ?? String(raw.id_atendimento),
    type: text(raw.tipo_atendimento) ?? "Atendimento",
    status: text(raw.status) ?? (closedAt ? "Fechado" : "Aberto"),
    open: closedAt === null,
    openingDescription: text(raw.descricao_abertura),
    closingDescription: text(raw.descricao_fechamento),
    closeReason: text(raw.motivo_fechamento),
    createdAt: text(raw.data_cadastro),
    closedAt,
    openedBy: text(raw.usuario_abertura),
    responsible: text(raw.usuario_responsavel),
    serviceName: text(raw.servico?.nome),
    orders: (raw.ordens_servico ?? []).map(toServiceOrder),
    messages: messages
      .map((item) => ({
        message: text(item.mensagem) ?? "",
        createdAt: text(item.data_cadastro_br) ?? (typeof item.data_cadastro === "string" ? text(item.data_cadastro) : text(item.data_cadastro?.date)),
        user: typeof item.usuario === "string" ? text(item.usuario) : text(item.usuario?.name),
      }))
      .filter((item) => item.message),
  };
}

export function toCpe(raw: RawCpe): Cpe {
  const latest = raw.historico_parametros?.[0];
  const params = latest?.parametros ?? {};
  return {
    id: raw.id_cpe,
    phyAddr: text(raw.phy_addr) ?? "—",
    updatedAt: text(latest?.data_cadastro_br) ?? text(latest?.created_at) ?? text(raw.data_ultima_atualizacao),
    model: text(params.model),
    state: text(params.phase_state),
    distance: text(params.distance),
    rxSignal: toNumber(params.rx_signal),
    txSignal: toNumber(params.tx_signal),
    onuInterface: text(params.onu_interface),
  };
}

export function toConnectionHistory(raw: { registros?: RawConnectionRecord[]; estatisticas?: { total_conexoes?: number; download_total?: number; upload_total?: number } }): ConnectionHistory {
  return {
    records: (raw.registros ?? []).map((item) => ({
      start: text(item.acctstarttimebr),
      end: text(item.acctstoptimebr),
      ip: text(item.framedipaddress),
      mac: text(item.callingstationid),
      nasIp: text(item.nasipaddress),
      downloadMb: toNumber(item.download_megabytes) ?? 0,
      uploadMb: toNumber(item.upload_megabytes) ?? 0,
    })),
    totals: raw.estatisticas
      ? {
          connections: raw.estatisticas.total_conexoes ?? 0,
          downloadMb: toNumber(raw.estatisticas.download_total) ?? 0,
          uploadMb: toNumber(raw.estatisticas.upload_total) ?? 0,
        }
      : null,
  };
}

export function toFiscalNotes(raw: RawFiscalNotes): FiscalNote[] {
  const telecom: FiscalNote[] = (raw.notas_fiscais ?? []).map((item) => ({
    id: item.id_nota_fiscal,
    kind: "nf_telecom",
    kindLabel: item.tipo_documento_fiscal?.codigo ? `NF ${item.tipo_documento_fiscal.codigo}` : "NF Telecom",
    number: text(item.numero_nota) ?? String(item.id_nota_fiscal),
    series: text(item.serie_nota),
    value: toNumber(item.valor),
    issuedAt: text(item.data_emissao_br),
    status: item.cancelado ? "cancelada" : "normal",
    canceled: item.cancelado === true,
    pdfUrl: null,
  }));
  const nfes: FiscalNote[] = (raw.nfes ?? []).map((item) => ({
    id: item.id_nfe,
    kind: "nfe",
    kindLabel: "NF-e",
    number: text(item.numero_nf) ?? String(item.id_nfe),
    series: text(item.serie),
    value: toNumber(item.valor),
    issuedAt: text(item.data_emissao_br),
    status: text(item.status),
    canceled: item.cancelado === true,
    pdfUrl: null,
  }));
  const nfses: FiscalNote[] = (raw.nfses ?? []).map((item) => ({
    id: item.id_nfse,
    kind: "nfse",
    kindLabel: "NFS-e",
    number: text(item.numero) ?? String(item.id_nfse),
    series: text(item.serie),
    value: toNumber(item.valor),
    issuedAt: text(item.data_cadastro_br),
    status: item.data_cancelamento_br ? "cancelada" : text(item.status),
    canceled: Boolean(item.data_cancelamento_br),
    pdfUrl: text(item.link_pdf),
  }));
  return [...nfses, ...telecom, ...nfes];
}

export function toViability(raw: RawViability): Viability {
  return {
    projects: (raw.resultado?.projetos ?? []).map((project) => ({
      name: text(project.projeto?.nome) ?? "Projeto",
      boxes: (project.busca?.elementos?.data ?? []).map((box) => ({
        name: text(box.caixa) ?? "Caixa",
        distance: text(box.distancia),
        total: box.total ?? 0,
        available: box.disponiveis ?? 0,
        reserved: box.reservadas ?? 0,
        used: box.utilizadas ?? 0,
      })),
    })),
    alerts: (raw.resultado?.alertas ?? []).map(alertText).filter((item): item is string => item !== null),
  };
}

export function toPlan(raw: RawPlan): Plan {
  return {
    id: raw.id_servico,
    name: text(raw.descricao) ?? `Plano ${raw.id_servico}`,
    value: toNumber(raw.valor) ?? 0,
    download: raw.velocidade_download ?? null,
    upload: raw.velocidade_upload ?? null,
  };
}

export function toProspect(raw: RawProspect): Prospect {
  return {
    id: raw.id_prospecto,
    name: text(raw.nome_razaosocial) ?? "Prospecto",
    phone: text(raw.telefone),
    document: text(raw.cpf_cnpj),
    createdAt: text(raw.created_at_br),
    origin: text(raw.origem),
  };
}
