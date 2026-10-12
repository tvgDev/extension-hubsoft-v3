import type { ContactAttribute, SystemVariable } from "../model";
import { ApiError, requestJson } from "./http";

const API_BASE = "https://api.focuschat.com.br/core/v2/api";

// O token de acesso da API é o id do canal do atendimento.
const headers = (canalId: string) => ({ "access-token": canalId, "Content-Type": "application/json" });

export const getSystemVariables = (canalId: string) =>
  requestJson<SystemVariable[]>(`${API_BASE}/system/variables`, { headers: headers(canalId) }, "Não foi possível carregar as variáveis do sistema");

export const getContactAttributes = (contatoId: string, canalId: string) =>
  requestJson<ContactAttribute[]>(
    `${API_BASE}/contacts/${contatoId}/get-attributes/`,
    { headers: headers(canalId) },
    "Não foi possível ler os dados do contato",
  );

export async function setContactAttributes(
  contatoId: string,
  canalId: string,
  attributes: Array<{ key: string; value: string; description: string }>,
): Promise<void> {
  const failure = "Não foi possível gravar o documento no contato";
  const result = await requestJson<{ status?: string | number; msg?: string } | null>(
    `${API_BASE}/contacts/${contatoId}/set-attributes`,
    { method: "POST", headers: headers(canalId), body: JSON.stringify(attributes) },
    failure,
  );
  if (String(result?.status) !== "200") {
    throw new ApiError(0, result?.msg ? `${failure}: ${result.msg}` : `${failure}.`);
  }
}

/** Mensagem na conversa; com `isWhisper` vira nota interna (o cliente não vê). */
export const sendText = (contatoId: string, canalId: string, message: string, isWhisper = false) =>
  requestJson<unknown>(
    `${API_BASE}/chats/send-text`,
    {
      method: "POST",
      headers: headers(canalId),
      body: JSON.stringify({
        contactId: contatoId,
        message,
        isWhisper,
        forceSend: true,
        verifyContact: false,
        delayInSeconds: 0,
        linkPreview: !isWhisper,
      }),
    },
    isWhisper ? "Não foi possível registrar a nota interna" : "Não foi possível enviar a mensagem",
  );

export const sendWhisper = (contatoId: string, canalId: string, message: string) => sendText(contatoId, canalId, message, true);

export const sendMedia = (contatoId: string, canalId: string, media: { url: string; fileName: string; caption: string; extension: string }) =>
  requestJson<unknown>(
    `${API_BASE}/chats/send-media`,
    {
      method: "POST",
      headers: headers(canalId),
      body: JSON.stringify({
        contactId: contatoId,
        forceSend: true,
        verifyContact: false,
        linkUrl: media.url,
        extension: media.extension,
        fileName: media.fileName,
        caption: media.caption,
        delayInSeconds: 0,
        isWhisper: false,
      }),
    },
    "Não foi possível enviar o arquivo na conversa",
  );
