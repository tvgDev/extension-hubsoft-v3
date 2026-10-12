# Extensão Hubsoft · FOCUS Chat

Widget de atendimento do FOCUS Chat. Ao abrir uma conversa, mostra o cadastro do
cliente no Hubsoft e as faturas em aberto, com envio de PIX, linha digitável e
PDF direto na conversa e desbloqueio em confiança.

Interface em React 19 + MUI 9, no padrão visual do painel do FOCUS Chat (faixa
azul-marinho, cartão branco com abas, seções recolhíveis).

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run lint
```

Fora do painel a tela fica em "aguardando atendimento": o módulo depende do
`WlExtension` (script `wlclient` carregado no `index.html`) para receber o
atendimento aberto.

## Configuração no FOCUS Chat

Variáveis do sistema:

| Variável | Uso |
| --- | --- |
| `1UrlHubsoft` | URL base da API do Hubsoft (sem barra no final) |
| `1UserHubsoft` / `1PassHubsoft` | usuário e senha do Hubsoft |
| `1CliendIdHubsoft` / `1ClientSecretHubsoft` | credenciais OAuth da integração |
| `noOpenWidget` | `"false"` para o widget não abrir sozinho ao entrar no atendimento |

O CPF/CNPJ do cliente fica no atributo `CPFCNPJCliente` do contato. Quando o
contato ainda não tem o atributo, o atendente informa o documento na aba
Cliente e o módulo grava para as próximas conversas.

## Estrutura

- `src/components/` — casca do painel (`PageShell`, `Section`, `OutlinedCard`), feedback (`useNotify`, `useConfirm`) e `useLoad`.
- `src/pages/` — `Welcome` (sem atendimento), `Home` (abas), `ClientTab`, `FinanceTab`.
- `src/services/` — `focuschatApi` e `hubsoftApi` (chamadas), `attendance` (regras: carregar, localizar, desbloquear, enviar).
- `src/theme.ts` — cores e medidas do painel.
