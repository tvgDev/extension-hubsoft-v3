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

export interface HubsoftClient {
  name: string;
  document: string;
  phone: string;
  email: string;
  plan: string | null;
  status: string | null;
  address: string | null;
  serviceId: number | null;
}

export interface InvoiceLine {
  description: string;
  value: number;
}

export interface Invoice {
  id: string;
  dueDate: string;
  value: number;
  status: string;
  pix: string | null;
  barcode: string | null;
  pdfUrl: string | null;
  paidAt: string | null;
  lines: InvoiceLine[];
}

/** Por que não há cliente para mostrar. */
export type LookupReason = "sem-credenciais" | "sem-documento" | "nao-encontrado";

/** Tudo que o módulo sabe sobre o atendimento aberto. */
export interface AttendanceData {
  credentials: HubsoftCredentials | null;
  /** CPF/CNPJ gravado no contato do FOCUS Chat. */
  document: string | null;
  client: HubsoftClient | null;
  invoices: Invoice[];
  reason: LookupReason | null;
}
