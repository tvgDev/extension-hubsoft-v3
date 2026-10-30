# Extensão Hubsoft · FOCUS Chat

Widget de atendimento do FOCUS Chat. Ao abrir uma conversa, mostra o cliente no
Hubsoft e deixa o atendente resolver o atendimento sem sair do chat.

Interface em React 19 + MUI 9, no padrão visual do painel do FOCUS Chat (faixa
azul-marinho, cartão branco com abas, seções recolhíveis).

## O que o módulo faz

| Aba | O que mostra | Ações |
| --- | --- | --- |
| Cliente | Contato da conversa, cadastro no Hubsoft, avisos do provedor, todos os serviços (plano, situação, login/senha PPPoE, senhas documentadas, endereço) | Localizar cliente por CPF/CNPJ e gravar no contato; desbloqueio em confiança com prazo; escolher o serviço usado nas outras abas |
| Conexão | Conectado agora?, último IP, concentrador, OLT/interface, MAC; sinal da ONU/CPE (RX/TX, distância, estado); últimas conexões com consumo | Derrubar sessão, resetar MAC, reiniciar equipamento |
| Financeiro | Faturas em aberto e histórico, com detalhamento; notas fiscais por período | Enviar PIX (com QR Code), linha digitável ou PDF na conversa; pedir ao Hubsoft para enviar fatura por e-mail/SMS; enviar nota por e-mail |
| Chamados | Atendimentos abertos/todos (protocolo, tipo, situação, OS vinculadas, mensagens); ordens de serviço | Abrir chamado (tipo, situação, descrição) e mandar o protocolo pro cliente; adicionar mensagem; fechar chamado com motivo; mensagem em OS |
| Cobertura | Para quem não é cliente: viabilidade por endereço (caixas e portas livres), planos por CEP, prospecto já cadastrado pelo telefone | Cadastrar prospecto no Hubsoft |

Toda ação registra uma nota interna no atendimento do FOCUS Chat.

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
| `1PortaRoteadorHubsoft` | opcional: porta padrão do painel do roteador (ex.: `8888`); o atendente pode trocar na hora |

O CPF/CNPJ do cliente fica no atributo `CPFCNPJCliente` do contato. Quando o
contato ainda não tem o atributo, o atendente informa o documento na aba
Cliente e o módulo grava para as próximas conversas.

O token OAuth do Hubsoft fica em memória e é reaproveitado até expirar (a API
limita a autenticação a 30 chamadas por minuto).

## Estrutura

- `src/components/` — casca do painel (`PageShell`, `Section`, `OutlinedCard`, `ReadOnlyField`), feedback (`useNotify`, `useConfirm`) e `useLoad`.
- `src/pages/` — `Welcome` (sem atendimento), `Home` (abas e seletor de serviço), `ClientTab`, `ConnectionTab`, `FinanceTab`, `TicketsTab`, `CoverageTab`.
- `src/services/` — `focuschatApi` (FOCUS Chat), `hubsoftApi` (cliente da API com token), `mappers` (formatos do Hubsoft → tipos do módulo), `catalog` (tipos/situações/motivos em cache), `attendance` (carregar atendimento, localizar cliente, notas internas, envio de fatura).
- `src/theme.ts` — cores e medidas do painel. `src/status.ts` — cores das situações.

Documentação da API do Hubsoft: https://docs.hubsoft.com.br/
