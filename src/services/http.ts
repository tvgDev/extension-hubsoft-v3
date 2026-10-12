export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * fetch + JSON com mensagens de erro em português. `failure` descreve a ação
 * que falhou ("Não foi possível buscar o cliente no Hubsoft"); se a API
 * devolver um motivo, ele vai junto.
 */
export async function requestJson<T>(url: string, init: RequestInit, failure: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(0, `${failure}. Verifique a conexão e tente de novo.`);
  }
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // resposta não-JSON: cai no tratamento abaixo
  }
  if (!response.ok) {
    const detail = data as { message?: string; msg?: string; error?: string; retry_after?: number } | null;
    const reason = detail?.msg ?? detail?.message ?? detail?.error;
    const wait = response.status === 429 && detail?.retry_after ? ` Aguarde ${detail.retry_after}s e tente de novo.` : "";
    throw new ApiError(response.status, (reason ? `${failure}: ${reason}` : `${failure} (erro ${response.status}).`) + wait);
  }
  return data as T;
}

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));
