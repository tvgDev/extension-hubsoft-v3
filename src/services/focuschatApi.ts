// src/services/focuschatApi.ts

const API_BASE = 'https://api.focuschat.com.br/core/v2/api';

export const getSystemVariables = async (canalId: string) => {
  const headers = new Headers({
    'access-token': canalId,
    'Content-Type': 'application/json'
  });

  const response = await fetch(`${API_BASE}/system/variables`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) throw new Error('Não foi possível carregar as variáveis do sistema');
  return response.json();
};

export const getContactAttributes = async (contatoId: string, canalId: string) => {
  const headers = new Headers({
    'access-token': canalId,
    'Content-Type': 'application/json'
  });

  const response = await fetch(`${API_BASE}/contacts/${contatoId}/get-attributes/`, {
    method: 'GET',
    headers
  });

  if (!response.ok) throw new Error('Falha ao buscar atributos do contato');
  return response.json();
};

export const setContactAttributes = async (contatoId: string, canalId: string, attributes: Array<{key: string, value: string, description: string}>) => {
  const headers = new Headers({
    'access-token': canalId,
    'Content-Type': 'application/json'
  });

  const response = await fetch(`${API_BASE}/contacts/${contatoId}/set-attributes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(attributes)
  });

  return response.json();
};

export const sendWhisper = async (contatoId: string, canalId: string, message: string) => {
  const headers = new Headers({
    'access-token': canalId,
    'Content-Type': 'application/json'
  });

  const payload = {
    contactId: contatoId,
    message: message,
    isWhisper: true,
    forceSend: true,
    verifyContact: false,
    delayInSeconds: 0,
    linkPreview: false
  };

  const response = await fetch(`${API_BASE}/chats/send-text`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  return response.json();
};

export const sendMedia = async (contatoId: string, canalId: string, mediaUrl: string, fileName: string, caption: string, extension: string) => {
  const headers = new Headers({
    'access-token': canalId,
    'Content-Type': 'application/json'
  });

  const payload = {
    contactId: contatoId,
    forceSend: true,
    verifyContact: false,
    linkUrl: mediaUrl,
    extension,
    fileName,
    caption,
    delayInSeconds: 0,
    isWhisper: false
  };

  const response = await fetch(`${API_BASE}/chats/send-media`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  return response.ok;
};

export const sendText = async (contatoId: string, canalId: string, message: string) => {
  const headers = new Headers({
    'access-token': canalId,
    'Content-Type': 'application/json'
  });

  const payload = {
    contactId: contatoId,
    message: message,
    isWhisper: false,
    forceSend: true,
    verifyContact: false,
    delayInSeconds: 0,
    linkPreview: true
  };

  const response = await fetch(`${API_BASE}/chats/send-text`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  return response.ok;
};
