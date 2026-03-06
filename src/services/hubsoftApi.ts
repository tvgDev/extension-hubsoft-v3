// src/services/hubsoftApi.ts

export const generateHubsoftToken = async (
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  user: string,
  pass: string
) => {
  const payload = {
    grant_type: 'password',
    client_id: clientId,
    client_secret: clientSecret,
    username: user,
    password: pass
  };

  const response = await fetch(`${apiUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error('Falha ao autenticar na API do Hubsoft');
  return response.json();
};

export const getClientData = async (apiUrl: string, token: string, cpfCnpj: string) => {
  const endpoint = `${apiUrl}/api/v1/integracao/cliente?limit=1&cancelado=nao&order_by=data_cadastro&order_type=asc&busca=cpf_cnpj&termo_busca=${cpfCnpj}`;
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Falha ao buscar dados do cliente no Hubsoft');
  return response.json();
};

export const getBoletosHubsoft = async (apiUrl: string, token: string, idClienteServico: number) => {
  const endpoint = `${apiUrl}/api/v1/integracao/cliente/financeiro?busca=id_cliente_servico&termo_busca=${idClienteServico}&limit=5&apenas_pendente=sim&order_by=data_vencimento&order_type=asc`;
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Falha ao buscar faturas no Hubsoft');
  return response.json();
};
