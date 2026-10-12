/** Atendimento aberto no painel do FOCUS Chat, como o WlExtension entrega. */
export interface WlAttendance {
  atendimentoId: string;
  canalId: string;
  contato: {
    id: string;
    nomeSecundario?: string;
    numero: string;
    linkImagem?: string;
  };
}

export interface SystemVariable {
  key: string;
  value: string;
}

export interface ContactAttribute {
  Key: string;
  Value: string;
}

/** Dados de acesso ao Hubsoft, lidos das variáveis do sistema do FOCUS Chat. */
export interface HubsoftCredentials {
  url: string;
  user: string;
  password: string;
  clientId: string;
  clientSecret: string;
}

export interface Address {
  full: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
}

/** Última conexão do serviço no RADIUS (só vem quando pedimos `ultima_conexao=sim`). */
export interface Connection {
  online: boolean;
  statusText: string | null;
  lastConnection: string | null;
  lastDisconnection: string | null;
  lastIp: string | null;
  nasIp: string | null;
}

/** Senha documentada no serviço (Wi-Fi, roteador, câmera…). */
export interface ServicePassword {
  id: number;
  description: string;
  user: string | null;
  password: string | null;
}

export interface Service {
  id: number;
  planNumber: number | null;
  name: string;
  value: number | null;
  /** Texto como o Hubsoft mostra ("Serviço Habilitado"). */
  status: string;
  /** Prefixo estável ("servico_habilitado", "suspenso_debito"…). */
  statusKey: string;
  technology: string | null;
  download: string | null;
  upload: string | null;
  login: string | null;
  password: string | null;
  ipv4: string | null;
  macAddr: string | null;
  phyAddr: string | null;
  installAddress: Address | null;
  connection: Connection | null;
  olt: string | null;
  oltInterface: string | null;
  concentrator: string | null;
  passwords: ServicePassword[];
}

export interface HubsoftClient {
  id: number;
  code: number | null;
  name: string;
  /** CPF/CNPJ como o Hubsoft devolve (só números). */
  document: string;
  personType: string | null;
  phone: string | null;
  email: string | null;
  /** Avisos que o provedor cadastra no Hubsoft para quem atende. */
  alerts: string[];
  services: Service[];
}

export interface InvoiceLine {
  description: string;
  value: number;
}

export interface Invoice {
  id: string;
  dueDate: string;
  value: number;
  paidValue: number | null;
  status: string;
  paid: boolean;
  pix: string | null;
  barcode: string | null;
  pdfUrl: string | null;
  paidAt: string | null;
  serviceName: string | null;
  lines: InvoiceLine[];
}

export type FiscalNoteKind = "nf_telecom" | "nfe" | "nfse";

export interface FiscalNote {
  id: number;
  kind: FiscalNoteKind;
  kindLabel: string;
  number: string;
  series: string | null;
  value: number | null;
  issuedAt: string | null;
  status: string | null;
  canceled: boolean;
  pdfUrl: string | null;
}

export interface Cpe {
  id: number;
  phyAddr: string;
  updatedAt: string | null;
  model: string | null;
  state: string | null;
  distance: string | null;
  rxSignal: number | null;
  txSignal: number | null;
  onuInterface: string | null;
}

export interface ConnectionRecord {
  start: string | null;
  end: string | null;
  ip: string | null;
  mac: string | null;
  nasIp: string | null;
  downloadMb: number;
  uploadMb: number;
}

export interface ConnectionHistory {
  records: ConnectionRecord[];
  totals: { connections: number; downloadMb: number; uploadMb: number } | null;
}

export interface ServiceOrder {
  id: number;
  number: string;
  type: string;
  status: string;
  closeStatus: string | null;
  createdAt: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  executedStart: string | null;
  executedEnd: string | null;
  openingDescription: string | null;
  serviceDescription: string | null;
  closingDescription: string | null;
  openedBy: string | null;
}

export interface TicketMessage {
  message: string;
  createdAt: string | null;
  user: string | null;
}

/** Atendimento (chamado) do cliente no Hubsoft. */
export interface Ticket {
  id: number;
  protocol: string;
  type: string;
  status: string;
  open: boolean;
  openingDescription: string | null;
  closingDescription: string | null;
  closeReason: string | null;
  createdAt: string | null;
  closedAt: string | null;
  openedBy: string | null;
  responsible: string | null;
  serviceName: string | null;
  orders: ServiceOrder[];
  messages: TicketMessage[];
}

export interface CatalogItem {
  id: number;
  label: string;
}

export interface TicketStatus extends CatalogItem {
  key: string;
  opensOrder: boolean;
}

export interface CloseReason extends CatalogItem {
  /** Vazio = vale para todos os tipos de atendimento. */
  ticketTypeIds: number[];
}

export interface ViabilityBox {
  name: string;
  distance: string | null;
  total: number;
  available: number;
  reserved: number;
  used: number;
}

export interface ViabilityProject {
  name: string;
  boxes: ViabilityBox[];
}

export interface Viability {
  projects: ViabilityProject[];
  alerts: string[];
}

export interface Plan {
  id: number;
  name: string;
  value: number;
  download: number | null;
  upload: number | null;
}

export interface Prospect {
  id: number;
  name: string;
  phone: string | null;
  document: string | null;
  createdAt: string | null;
  origin: string | null;
}

/** Por que não há cliente para mostrar. */
export type LookupReason = "sem-credenciais" | "sem-documento" | "nao-encontrado";

/** Tudo que o módulo carrega ao abrir um atendimento. */
export interface AttendanceData {
  credentials: HubsoftCredentials | null;
  /** CPF/CNPJ gravado no contato do FOCUS Chat. */
  document: string | null;
  client: HubsoftClient | null;
  /** Faturas em aberto (carregadas junto, para o contador da aba). */
  invoices: Invoice[];
  /** Quantidade de chamados abertos (contador da aba). */
  openTickets: number;
  reason: LookupReason | null;
}
