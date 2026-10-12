import type { AttendanceData, HubsoftClient, HubsoftCredentials, Invoice, SystemVariable, WlAttendance } from "../model";
import { getContactAttributes, getSystemVariables, sendMedia, sendText, sendWhisper, setContactAttributes } from "./focuschatApi";
import { findClient, generateToken, listPendingInvoices, unlockService, type RawClient, type RawInvoice } from "./hubsoftApi";

/** Atributo do contato (FOCUS Chat) que guarda o CPF/CNPJ do cliente. */
export const DOCUMENT_ATTRIBUTE = "CPFCNPJCliente";

/** Variáveis do sistema (FOCUS Chat) com os dados de acesso ao Hubsoft. */
export const CREDENTIAL_VARIABLES = {
  url: "1UrlHubsoft",
  user: "1UserHubsoft",
  password: "1PassHubsoft",
  clientId: "1CliendIdHubsoft",
  clientSecret: "1ClientSecretHubsoft",
} as const;

function readCredentials(variables: SystemVariable[]): HubsoftCredentials | null {
  const read = (key: string) => variables.find((item) => item.key === key)?.value?.trim() ?? "";
  const credentials: HubsoftCredentials = {
    url: read(CREDENTIAL_VARIABLES.url).replace(/\/+$/, ""),
    user: read(CREDENTIAL_VARIABLES.user),
    password: read(CREDENTIAL_VARIABLES.password),
    clientId: read(CREDENTIAL_VARIABLES.clientId),
    clientSecret: read(CREDENTIAL_VARIABLES.clientSecret),
  };
  return Object.values(credentials).every(Boolean) ? credentials : null;
}

const toClient = (raw: RawClient): HubsoftClient => {
  const service = raw.servicos?.[0];
  return {
    name: raw.nome_razaosocial,
    document: raw.cpf_cnpj,
    phone: raw.telefone_primario,
    email: raw.email_principal,
    plan: service?.nome ?? null,
    status: service?.status ?? null,
    address: service?.endereco_instalacao?.completo ?? null,
    serviceId: service?.id_cliente_servico ?? null,
  };
};

const toInvoice = (raw: RawInvoice, index: number): Invoice => ({
  id: raw.id !== undefined && raw.id !== null ? String(raw.id) : `fatura-${index}`,
  dueDate: raw.data_vencimento,
  value: Number(raw.valor) || 0,
  status: raw.status ?? "",
  pix: raw.pix_copia_cola || null,
  barcode: raw.linha_digitavel || null,
  pdfUrl: raw.link || null,
  paidAt: raw.data_pagamento || null,
  lines: (raw.detalhamento ?? []).map((line) => ({ description: line.descricao, value: Number(line.valor) || 0 })),
});

/** Busca o cliente pelo CPF/CNPJ e as faturas em aberto do primeiro serviço. */
export async function lookupClient(credentials: HubsoftCredentials, document: string): Promise<{ client: HubsoftClient | null; invoices: Invoice[] }> {
  const { access_token: token } = await generateToken(credentials);
  const found = await findClient(credentials.url, token, document);
  const raw = found.clientes?.[0];
  if (found.status !== "success" || !raw) return { client: null, invoices: [] };

  const client = toClient(raw);
  if (client.serviceId === null) return { client, invoices: [] };
  const result = await listPendingInvoices(credentials.url, token, client.serviceId);
  return { client, invoices: (result.faturas ?? []).map(toInvoice) };
}

/** Carrega tudo que o módulo mostra ao abrir um atendimento. */
export async function loadAttendance(attendance: WlAttendance): Promise<AttendanceData> {
  const variables = await getSystemVariables(attendance.canalId);

  // Mesmo comportamento do módulo antigo: o widget abre sozinho, a não ser que
  // a variável noOpenWidget esteja como "false".
  if (variables.find((item) => item.key === "noOpenWidget")?.value !== "false") {
    window.WlExtension?.openWidget();
  }

  const credentials = readCredentials(variables);
  const attributes = await getContactAttributes(attendance.contato.id, attendance.canalId);
  const document = attributes.find((item) => item.Key === DOCUMENT_ATTRIBUTE)?.Value?.trim() || null;

  const base: AttendanceData = { credentials, document, client: null, invoices: [], reason: null };
  if (!credentials) return { ...base, reason: "sem-credenciais" };
  if (!document) return { ...base, reason: "sem-documento" };

  const found = await lookupClient(credentials, document);
  return { ...base, ...found, reason: found.client ? null : "nao-encontrado" };
}

/** Grava o CPF/CNPJ no contato, para o módulo achar o cliente nas próximas conversas. */
export const saveDocument = (attendance: WlAttendance, document: string) =>
  setContactAttributes(attendance.contato.id, attendance.canalId, [{ key: DOCUMENT_ATTRIBUTE, value: document, description: DOCUMENT_ATTRIBUTE }]);

/** Desbloqueio em confiança no Hubsoft e nota interna no atendimento. */
export async function unlockInTrust(attendance: WlAttendance, credentials: HubsoftCredentials, serviceId: number): Promise<void> {
  const { access_token: token } = await generateToken(credentials);
  const result = await unlockService(credentials.url, token, serviceId);
  if (result.status !== "success") {
    throw new Error(result.message || "O Hubsoft não aceitou o desbloqueio. Confira a situação do serviço.");
  }
  await sendWhisper(attendance.contato.id, attendance.canalId, "Serviço desbloqueado em confiança pelo atendente.");
}

export type InvoiceItem = "pix" | "barcode" | "pdf";

/** Envia o item da fatura na conversa e registra uma nota interna no atendimento. */
export async function sendInvoiceItem(attendance: WlAttendance, item: InvoiceItem, invoice: Invoice): Promise<void> {
  const contactId = attendance.contato.id;
  const { canalId } = attendance;

  if (item === "pdf") {
    if (!invoice.pdfUrl) throw new Error("Esta fatura não tem PDF disponível.");
    await sendMedia(contactId, canalId, { url: invoice.pdfUrl, fileName: "Boleto em PDF", caption: "Boleto em PDF", extension: ".pdf" });
    await sendWhisper(contactId, canalId, "PDF do Boleto enviado ao cliente pelo sistema.");
    return;
  }

  if (item === "pix") {
    if (!invoice.pix) throw new Error("Esta fatura não tem PIX disponível.");
    await sendText(contactId, canalId, invoice.pix);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(invoice.pix)}`;
    await sendMedia(contactId, canalId, { url: qrCodeUrl, fileName: "QRCode PIX", caption: "QR Code do PIX", extension: ".png" });
    await sendWhisper(contactId, canalId, "PIX Enviado ao cliente pelo sistema.");
    return;
  }

  if (!invoice.barcode) throw new Error("Esta fatura não tem linha digitável disponível.");
  await sendText(contactId, canalId, invoice.barcode);
  await sendWhisper(contactId, canalId, "Código de Barras enviado ao cliente pelo sistema.");
}
