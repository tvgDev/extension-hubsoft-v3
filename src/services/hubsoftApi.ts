import type { HubsoftCredentials } from "../model";
import { requestJson } from "./http";

// Formatos devolvidos pela API de integração do Hubsoft (só o que o módulo usa).
export interface RawService {
  nome?: string;
  status?: string;
  endereco_instalacao?: { completo?: string };
  id_cliente_servico?: number;
}

export interface RawClient {
  nome_razaosocial: string;
  cpf_cnpj: string;
  telefone_primario: string;
  email_principal: string;
  servicos?: RawService[];
}

export interface RawInvoice {
  id?: string | number;
  data_vencimento: string;
  valor: number;
  status: string;
  linha_digitavel?: string;
  pix_copia_cola?: string;
  link?: string;
  data_pagamento?: string;
  detalhamento?: Array<{ descricao: string; valor: number }>;
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export const generateToken = (credentials: HubsoftCredentials) =>
  requestJson<{ access_token: string }>(
    `${credentials.url}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "password",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        username: credentials.user,
        password: credentials.password,
      }),
    },
    "Não foi possível entrar no Hubsoft. Confira os dados de acesso nas variáveis do sistema",
  );

export const findClient = (url: string, token: string, document: string) =>
  requestJson<{ status?: string; clientes?: RawClient[] }>(
    `${url}/api/v1/integracao/cliente?limit=1&cancelado=nao&order_by=data_cadastro&order_type=asc&busca=cpf_cnpj&termo_busca=${encodeURIComponent(document)}`,
    { headers: bearer(token) },
    "Não foi possível buscar o cliente no Hubsoft",
  );

export const listPendingInvoices = (url: string, token: string, serviceId: number) =>
  requestJson<{ faturas?: RawInvoice[] }>(
    `${url}/api/v1/integracao/cliente/financeiro?busca=id_cliente_servico&termo_busca=${serviceId}&limit=5&apenas_pendente=sim&order_by=data_vencimento&order_type=asc`,
    { headers: bearer(token) },
    "Não foi possível buscar as faturas no Hubsoft",
  );

export const unlockService = (url: string, token: string, serviceId: number) =>
  requestJson<{ status?: string; message?: string }>(
    `${url}/api/v1/integracao/cliente/servico/${serviceId}/desbloqueio_confianca`,
    { method: "POST", headers: { ...bearer(token), "Content-Type": "application/json" }, body: "{}" },
    "Não foi possível desbloquear o serviço no Hubsoft",
  );
