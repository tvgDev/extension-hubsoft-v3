import type { AttendanceData, HubsoftClient, HubsoftCredentials, Invoice, SystemVariable, WlAttendance } from "../model";
import { getContactAttributes, getSystemVariables, sendMedia, sendText, sendWhisper, setContactAttributes } from "./focuschatApi";
import { HubsoftApi } from "./hubsoftApi";
import { toClient, toInvoice } from "./mappers";

/** Variável do sistema (opcional) com a porta padrão do painel do roteador, ex.: 8888. */
export const ROUTER_PORT_VARIABLE = "1PortaRoteadorHubsoft";

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

export interface Lookup {
  client: HubsoftClient | null;
  invoices: Invoice[];
  openTickets: number;
}

/** Busca o cliente pelo CPF/CNPJ, as faturas em aberto e quantos chamados estão abertos. */
export async function lookupClient(api: HubsoftApi, document: string): Promise<Lookup> {
  const found = await api.findClient(document);
  const raw = found.clientes?.[0];
  if (!raw) return { client: null, invoices: [], openTickets: 0 };

  const client = toClient(raw);
  const [invoices, openTickets] = await Promise.all([
    api.listInvoices(client.document, true, 50).then((result) => (result.faturas ?? []).map(toInvoice)),
    // Só alimenta o contador da aba; se falhar, a aba Chamados mostra o erro ao abrir.
    api.listTickets(client.document, true).then((result) => (result.atendimentos ?? []).length).catch(() => 0),
  ]);
  return { client, invoices, openTickets };
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

  const routerPort = variables.find((item) => item.key === ROUTER_PORT_VARIABLE)?.value?.trim() || null;
  const base: AttendanceData = { credentials, document, client: null, invoices: [], openTickets: 0, routerPort, reason: null };
  if (!credentials) return { ...base, reason: "sem-credenciais" };
  if (!document) return { ...base, reason: "sem-documento" };

  const found = await lookupClient(new HubsoftApi(credentials), document);
  return { ...base, ...found, reason: found.client ? null : "nao-encontrado" };
}

/** Grava o CPF/CNPJ no contato, para o módulo achar o cliente nas próximas conversas. */
export const saveDocument = (attendance: WlAttendance, document: string) =>
  setContactAttributes(attendance.contato.id, attendance.canalId, [{ key: DOCUMENT_ATTRIBUTE, value: document, description: DOCUMENT_ATTRIBUTE }]);

/** Nota interna no atendimento do FOCUS Chat (o cliente não vê). */
export const addNote = (attendance: WlAttendance, note: string) => sendWhisper(attendance.contato.id, attendance.canalId, note);

/** Mensagem para o cliente na conversa. */
export const sendToContact = (attendance: WlAttendance, message: string) => sendText(attendance.contato.id, attendance.canalId, message);

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
