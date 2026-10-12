import type { FiscalNoteKind, HubsoftCredentials } from "../model";
import { ApiError, requestJson } from "./http";

// ---------------------------------------------------------------------------
// Formatos devolvidos pela API de integração do Hubsoft (só o que o módulo usa).
// ---------------------------------------------------------------------------

export interface RawEnvelope {
  status?: string;
  msg?: string;
  message?: string;
}

export interface RawAddress {
  completo?: string | null;
  logradouro?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}

export interface RawConnection {
  conectado?: boolean;
  ultima_conexao?: string | null;
  ultima_desconexao?: string | null;
  ultimo_ipv4?: string | null;
  ultimo_nas_ip?: string | null;
  status_txt?: string | null;
  status_txt_resumido?: string | null;
}

export interface RawPassword {
  id_cliente_servico_senha: number;
  descricao?: string | null;
  usuario?: string | null;
  senha?: string | null;
}

export interface RawService {
  id_cliente_servico: number;
  numero_plano?: number | null;
  nome?: string | null;
  valor?: number | string | null;
  status?: string | null;
  status_prefixo?: string | null;
  tecnologia?: string | null;
  velocidade_download?: string | null;
  velocidade_upload?: string | null;
  login?: string | null;
  senha?: string | null;
  ipv4?: string | null;
  mac_addr?: string | null;
  phy_addr?: string | null;
  endereco_instalacao?: RawAddress | null;
  ultima_conexao?: RawConnection | null;
  interface?: { nome?: string | null } | null;
  equipamento_conexao?: { nome?: string | null } | null;
  equipamento_roteamento?: { nome?: string | null } | null;
  senhas?: RawPassword[] | null;
}

export interface RawClient {
  id_cliente: number;
  codigo_cliente?: number | null;
  nome_razaosocial: string;
  cpf_cnpj: string;
  tipo_pessoa?: string | null;
  telefone_primario?: string | null;
  email_principal?: string | null;
  alerta?: boolean;
  alerta_mensagens?: unknown[] | null;
  servicos?: RawService[] | null;
}

export interface RawInvoice {
  id_fatura?: number | string;
  quitado?: boolean;
  status?: string | null;
  linha_digitavel?: string | null;
  pix_copia_cola?: string | null;
  link?: string | null;
  valor?: number | string | null;
  valor_pago?: number | string | null;
  data_vencimento?: string | null;
  data_pagamento?: string | null;
  detalhamento?: Array<{ descricao?: string | null; valor?: number | string | null }> | null;
  cliente?: { servico?: { nome?: string | null } | null } | null;
}

export interface RawServiceOrder {
  id_ordem_servico: number;
  numero_ordem_servico?: string | number | null;
  tipo?: string | null;
  status?: string | null;
  status_fechamento?: string | null;
  data_cadastro?: string | null;
  data_inicio_programado?: string | null;
  data_termino_programado?: string | null;
  data_inicio_executado?: string | null;
  data_termino_executado?: string | null;
  descricao_abertura?: string | null;
  descricao_servico?: string | null;
  descricao_fechamento?: string | null;
  usuario_abertura?: string | null;
}

export interface RawTicketMessage {
  mensagem?: string | null;
  data_cadastro_br?: string | null;
  data_cadastro?: string | { date?: string } | null;
  usuario?: { name?: string | null } | string | null;
}

export interface RawTicket {
  id_atendimento: number;
  protocolo?: string | number | null;
  descricao_abertura?: string | null;
  descricao_fechamento?: string | null;
  tipo_atendimento?: string | null;
  usuario_abertura?: string | null;
  usuario_responsavel?: string | null;
  data_cadastro?: string | null;
  data_fechamento?: string | null;
  motivo_fechamento?: string | null;
  status?: string | null;
  servico?: { nome?: string | null } | null;
  ordens_servico?: RawServiceOrder[] | null;
  atendimento_mensagem?: RawTicketMessage[] | null;
  mensagens?: RawTicketMessage[] | null;
}

export interface RawCpe {
  id_cpe: number;
  phy_addr?: string | null;
  data_ultima_atualizacao?: string | null;
  historico_parametros?: Array<{
    parametros?: Record<string, string | number | null | undefined> | null;
    created_at?: string | null;
    data_cadastro_br?: string | null;
  }> | null;
}

export interface RawConnectionRecord {
  acctstarttimebr?: string | null;
  acctstoptimebr?: string | null;
  framedipaddress?: string | null;
  callingstationid?: string | null;
  nasipaddress?: string | null;
  download_megabytes?: number | string | null;
  upload_megabytes?: number | string | null;
}

export interface RawFiscalNotes extends RawEnvelope {
  notas_fiscais?: Array<{
    id_nota_fiscal: number;
    numero_nota?: string | number | null;
    serie_nota?: string | null;
    valor?: number | string | null;
    data_emissao_br?: string | null;
    cancelado?: boolean;
    tipo_documento_fiscal?: { codigo?: string | null; descricao?: string | null } | null;
  }> | null;
  nfes?: Array<{
    id_nfe: number;
    numero_nf?: string | number | null;
    serie?: string | null;
    status?: string | null;
    data_emissao_br?: string | null;
    cancelado?: boolean;
    valor?: number | string | null;
  }> | null;
  nfses?: Array<{
    id_nfse: number;
    numero?: string | number | null;
    serie?: string | null;
    valor?: number | string | null;
    data_cadastro_br?: string | null;
    status?: string | null;
    link_pdf?: string | null;
    data_cancelamento_br?: string | null;
  }> | null;
}

export interface RawViability extends RawEnvelope {
  resultado?: {
    projetos?: Array<{
      projeto?: { nome?: string | null } | null;
      busca?: {
        elementos?: {
          data?: Array<{
            caixa?: string | null;
            distancia?: string | null;
            total?: number | null;
            disponiveis?: number | null;
            reservadas?: number | null;
            utilizadas?: number | null;
          }> | null;
        } | null;
      } | null;
    }> | null;
    alertas?: unknown[] | null;
  } | null;
}

export interface RawPlan {
  id_servico: number;
  descricao?: string | null;
  valor?: number | string | null;
  velocidade_download?: number | null;
  velocidade_upload?: number | null;
}

export interface RawProspect {
  id_prospecto: number;
  nome_razaosocial?: string | null;
  telefone?: string | null;
  cpf_cnpj?: string | null;
  created_at_br?: string | null;
  origem?: string | null;
}

export interface OpenTicketPayload {
  id_cliente_servico: number;
  id_tipo_atendimento?: number;
  id_atendimento_status?: number;
  descricao: string;
  nome: string;
  telefone: string;
  email?: string;
  id_origem_contato?: number;
  parametros?: Record<string, string | number>;
}

export interface ViabilityAddress {
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface ProspectPayload {
  cep: string;
  servico: { id_servico: number; valor: number };
  nome_razaosocial: string;
  tipo_pessoa: "pf" | "pj";
  cpf_cnpj?: string;
  telefone: string;
  email?: string;
  observacao?: string;
  bairro: string;
  endereco: string;
  numero: string;
  complemento?: string;
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface TokenEntry {
  token: string;
  expiresAt: number;
}

// Um token por conta, compartilhado entre atendimentos: a documentação do
// Hubsoft pede para não autenticar a cada chamada (limite de 30/min).
const tokens = new Map<string, TokenEntry>();

const INTEGRATION = "/api/v1/integracao";

/** Cliente da API de integração do Hubsoft: cuida do token e traduz os erros. */
export class HubsoftApi {
  readonly url: string;
  private readonly credentials: HubsoftCredentials;

  constructor(credentials: HubsoftCredentials) {
    this.credentials = credentials;
    this.url = credentials.url;
  }

  private get tokenKey(): string {
    return `${this.credentials.url}|${this.credentials.clientId}|${this.credentials.user}`;
  }

  private async token(renew = false): Promise<string> {
    const cached = tokens.get(this.tokenKey);
    if (!renew && cached && cached.expiresAt > Date.now()) return cached.token;
    const c = this.credentials;
    const data = await requestJson<{ access_token?: string; expires_in?: number }>(
      `${c.url}/oauth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant_type: "password", client_id: c.clientId, client_secret: c.clientSecret, username: c.user, password: c.password }),
      },
      "Não foi possível entrar no Hubsoft. Confira os dados de acesso nas variáveis do sistema",
    );
    if (!data.access_token) throw new ApiError(0, "O Hubsoft não devolveu um token de acesso. Confira os dados de acesso nas variáveis do sistema.");
    const ttlSeconds = Math.max(60, (Number(data.expires_in) || 3600) - 60);
    tokens.set(this.tokenKey, { token: data.access_token, expiresAt: Date.now() + ttlSeconds * 1000 });
    return data.access_token;
  }

  private async call<T extends RawEnvelope>(
    method: "GET" | "POST" | "PUT",
    path: string,
    failure: string,
    options: { query?: Query; body?: unknown } = {},
    retry = true,
  ): Promise<T> {
    const token = await this.token();
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    }
    const query = params.toString();
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    let data: T;
    try {
      data = await requestJson<T>(
        `${this.url}${path}${query ? `?${query}` : ""}`,
        { method, headers, body: options.body !== undefined ? JSON.stringify(options.body) : undefined },
        failure,
      );
    } catch (error) {
      if (retry && error instanceof ApiError && error.status === 401) {
        await this.token(true);
        return this.call<T>(method, path, failure, options, false);
      }
      throw error;
    }
    // O Hubsoft às vezes responde 200 com status "error" no corpo.
    if (data && data.status === "error") {
      const reason = data.msg ?? data.message;
      throw new ApiError(0, reason ? `${failure}: ${reason}` : `${failure}.`);
    }
    return data;
  }

  // ----- Cliente -----------------------------------------------------------

  findClient(document: string) {
    return this.call<RawEnvelope & { clientes?: RawClient[] }>("GET", `${INTEGRATION}/cliente`, "Não foi possível buscar o cliente no Hubsoft", {
      query: { busca: "cpf_cnpj", termo_busca: document, limit: 1, cancelado: "nao", ultima_conexao: "sim", order_by: "data_cadastro", order_type: "asc" },
    });
  }

  unlockInTrust(serviceId: number, days: number) {
    return this.call<RawEnvelope>("POST", `${INTEGRATION}/cliente/desbloqueio_confianca`, "Não foi possível desbloquear o serviço no Hubsoft", {
      body: { id_cliente_servico: serviceId, dias_desbloqueio: days },
    });
  }

  // ----- Conexão -----------------------------------------------------------

  disconnect(serviceId: number) {
    return this.call<RawEnvelope & { login?: string }>("GET", `${INTEGRATION}/cliente/solicitar_desconexao/${serviceId}`, "Não foi possível derrubar a sessão");
  }

  resetMac(serviceId: number) {
    return this.call<RawEnvelope>("POST", `${INTEGRATION}/cliente/reset_mac_addr`, "Não foi possível resetar o MAC", { body: { id_cliente_servico: serviceId } });
  }

  listCpes(serviceId: number) {
    return this.call<RawEnvelope & { cpes?: RawCpe[] }>("GET", `${INTEGRATION}/rede/cpe/todos`, "Não foi possível consultar o equipamento do cliente", {
      query: { pagina: 0, itens_por_pagina: 20, busca: "id_cliente_servico", termo_busca: serviceId },
    });
  }

  rebootCpe(phyAddr: string) {
    return this.call<RawEnvelope>("POST", `${INTEGRATION}/rede/reiniciar_cpe/${encodeURIComponent(phyAddr)}`, "Não foi possível reiniciar o equipamento");
  }

  connectionHistory(login: string, limit: number) {
    return this.call<RawEnvelope & { registros?: RawConnectionRecord[]; estatisticas?: { total_conexoes?: number; download_total?: number; upload_total?: number } }>(
      "GET",
      `${INTEGRATION}/cliente/extrato_conexao`,
      "Não foi possível consultar o histórico de conexões",
      { query: { busca: "login", termo_busca: login, limit } },
    );
  }

  // ----- Financeiro --------------------------------------------------------

  listInvoices(document: string, pending: boolean, limit: number) {
    return this.call<RawEnvelope & { faturas?: RawInvoice[] }>("GET", `${INTEGRATION}/cliente/financeiro`, "Não foi possível buscar as faturas no Hubsoft", {
      query: { busca: "cpf_cnpj", termo_busca: document, apenas_pendente: pending ? "sim" : "nao", limit, order_by: "data_vencimento", order_type: pending ? "asc" : "desc" },
    });
  }

  sendInvoiceEmail(invoiceId: string) {
    return this.call<RawEnvelope>("POST", `${INTEGRATION}/cliente/financeiro/enviar_email`, "Não foi possível enviar a fatura por e-mail", { body: { id_fatura: invoiceId } });
  }

  sendInvoiceSms(invoiceId: string) {
    return this.call<RawEnvelope>("POST", `${INTEGRATION}/cliente/financeiro/enviar_sms`, "Não foi possível enviar a fatura por SMS", { body: { id_fatura: invoiceId } });
  }

  listFiscalNotes(clientId: number, from: string, to: string) {
    return this.call<RawFiscalNotes>("GET", `${INTEGRATION}/cliente/nota_fiscal`, "Não foi possível consultar as notas fiscais", {
      query: { busca: "id_cliente", termo_busca: clientId, data_inicio: from, data_fim: to },
    });
  }

  sendFiscalNoteEmail(noteId: number, kind: FiscalNoteKind) {
    return this.call<RawEnvelope>("POST", `${INTEGRATION}/cliente/nota_fiscal/enviar_email`, "Não foi possível enviar a nota por e-mail", {
      body: { id_nota_fiscal: noteId, tipo_documento: kind },
    });
  }

  // ----- Chamados e ordens de serviço --------------------------------------

  listTickets(document: string, pending: boolean) {
    return this.call<RawEnvelope & { atendimentos?: RawTicket[] }>("GET", `${INTEGRATION}/cliente/atendimento`, "Não foi possível consultar os chamados", {
      query: { busca: "cpf_cnpj", termo_busca: document, apenas_pendente: pending ? "sim" : "nao", limit: 20, order_by: "data_cadastro", order_type: "desc", relacoes: "atendimento_mensagem" },
    });
  }

  openTicket(payload: OpenTicketPayload) {
    return this.call<RawEnvelope & { atendimento?: RawTicket }>("POST", `${INTEGRATION}/atendimento`, "Não foi possível abrir o chamado no Hubsoft", { body: payload });
  }

  addTicketMessage(ticketId: number, message: string) {
    return this.call<RawEnvelope>("POST", `${INTEGRATION}/atendimento/adicionar_mensagem/${ticketId}`, "Não foi possível adicionar a mensagem ao chamado", { body: { mensagem: message } });
  }

  closeTicket(ticketId: number, closing: { id_motivo_fechamento_atendimento?: number; descricao_fechamento: string }) {
    return this.call<RawEnvelope>("PUT", `${INTEGRATION}/atendimento/${ticketId}`, "Não foi possível fechar o chamado", {
      body: { fechar_atendimento: true, parametros_fechamento: closing },
    });
  }

  listServiceOrders(document: string) {
    return this.call<RawEnvelope & { ordens_servico?: RawServiceOrder[] }>("GET", `${INTEGRATION}/cliente/ordem_servico`, "Não foi possível consultar as ordens de serviço", {
      query: { busca: "cpf_cnpj", termo_busca: document, limit: 20, order_by: "data_cadastro", order_type: "desc", exibir_atendimento: "true" },
    });
  }

  addServiceOrderMessage(orderId: number, message: string) {
    return this.call<RawEnvelope>("POST", `${INTEGRATION}/ordem_servico/adicionar_mensagem/${orderId}`, "Não foi possível adicionar a mensagem à OS", { body: { mensagem: message } });
  }

  // ----- Catálogos de configuração -----------------------------------------

  ticketTypes() {
    return this.call<RawEnvelope & { tipos_atendimento?: Array<{ id_tipo_atendimento: number; descricao?: string | null }> }>(
      "GET",
      `${INTEGRATION}/configuracao/tipo_atendimento`,
      "Não foi possível carregar os tipos de atendimento",
    );
  }

  ticketStatuses() {
    return this.call<RawEnvelope & { status_atendimento?: Array<{ id_atendimento_status: number; descricao?: string | null; display?: string | null; prefixo?: string | null; abrir_ordem_servico?: boolean }> }>(
      "GET",
      `${INTEGRATION}/configuracao/status_atendimento`,
      "Não foi possível carregar as situações de atendimento",
    );
  }

  contactOrigins() {
    return this.call<RawEnvelope & { origem_contatos?: Array<{ id_origem_contato: number; descricao?: string | null }> }>(
      "GET",
      `${INTEGRATION}/configuracao/origem_contato`,
      "Não foi possível carregar as origens de contato",
    );
  }

  closeReasons() {
    return this.call<RawEnvelope & { motivos_fechamento?: Array<{ id_motivo_fechamento_atendimento: number; descricao?: string | null; motivos_fechamento_tipo_atendimento?: Array<{ id_tipo_atendimento: number }> | null }> }>(
      "GET",
      `${INTEGRATION}/configuracao/motivo_fechamento_atendimento`,
      "Não foi possível carregar os motivos de fechamento",
    );
  }

  // ----- Cobertura e prospectos --------------------------------------------

  checkViability(address: ViabilityAddress, radius = 250) {
    return this.call<RawViability>("POST", `${INTEGRATION}/mapeamento/viabilidade/consultar`, "Não foi possível consultar a cobertura", {
      body: { tipo_busca: "endereco", raio: radius, endereco: address, detalhar_portas: false },
    });
  }

  plansByCep(cep: string) {
    return this.call<RawEnvelope & { servicos?: RawPlan[] }>("GET", `${INTEGRATION}/prospecto/create`, "Não foi possível buscar os planos para este CEP", { query: { cep } });
  }

  createProspect(payload: ProspectPayload) {
    return this.call<RawEnvelope & { prospecto?: RawProspect }>("POST", `${INTEGRATION}/prospecto`, "Não foi possível cadastrar o prospecto", { body: payload });
  }

  findProspects(field: "telefone" | "nome_razaosocial", term: string) {
    return this.call<RawEnvelope & { prospectos?: RawProspect[] }>("GET", `${INTEGRATION}/prospecto`, "Não foi possível consultar os prospectos", {
      query: { busca: field, termo_busca: term },
    });
  }
}
