import Campaign from "@mui/icons-material/Campaign";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import LockOpen from "@mui/icons-material/LockOpen";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Search from "@mui/icons-material/Search";
import SupportAgent from "@mui/icons-material/SupportAgent";
import Wifi from "@mui/icons-material/Wifi";
import WifiOff from "@mui/icons-material/WifiOff";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useAttendance } from "../attendance";
import { RoundAvatar } from "../components/common";
import { InfoGrid, InfoItem } from "../components/InfoItem";
import { content } from "../components/layout";
import { OutlinedCard } from "../components/OutlinedCard";
import { Section } from "../components/Section";
import { StatusChip } from "../components/StatusChip";
import { StatusTile } from "../components/StatusTile";
import { useConfirm, useNotify } from "../components/useFeedback";
import { formatMoney } from "../format";
import type { AttendanceData, Service } from "../model";
import { addNote, CREDENTIAL_VARIABLES, lookupClient, saveDocument } from "../services/attendance";
import { needsUnlock, statusLabel } from "../status";

const UNLOCK_DAYS = [1, 2, 3, 5, 7];

/** Aba Cliente: resumo da situação, cadastro no Hubsoft e serviços contratados. */
export function ClientTab() {
  const { attendance, data, setData, api, service, selectService, updateService } = useAttendance();
  const notify = useNotify();
  const confirm = useConfirm();
  const [document, setDocument] = useState("");
  const [days, setDays] = useState(1);
  const [busy, setBusy] = useState(false);
  if (!data) return null;

  const { credentials, client } = data;
  const contact = attendance.contato;
  const avatar = contact.linkImagem && !contact.linkImagem.includes("undefined") ? contact.linkImagem : null;

  const locate = async () => {
    const value = document.trim();
    if (!api || !value) return;
    setBusy(true);
    try {
      const found = await lookupClient(api, value);
      setData({ ...data, document: value, ...found, reason: found.client ? null : "nao-encontrado" });
      if (!found.client) return;
      notify.success("Cliente localizado no Hubsoft");
      // Guarda o documento no contato para as próximas conversas abrirem direto.
      try {
        await saveDocument(attendance, value);
      } catch (failure) {
        notify.error(failure);
      }
    } catch (failure) {
      notify.error(failure);
    } finally {
      setBusy(false);
    }
  };

  const unlock = async () => {
    if (!api || !service) return;
    const period = days === 1 ? "1 dia" : `${days} dias`;
    const confirmed = await confirm({
      title: "Desbloquear em confiança?",
      message: `O serviço volta a funcionar na hora por ${period} e o atendimento recebe uma nota interna. Use quando o cliente combinou o pagamento.`,
      confirmLabel: "Desbloquear",
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      const result = await api.unlockInTrust(service.id, days);
      updateService(service.id, { status: "Serviço Habilitado", statusKey: "servico_habilitado" });
      await addNote(attendance, `Serviço desbloqueado em confiança pelo atendente por ${period}.`);
      notify.success(result.msg || "Serviço desbloqueado em confiança");
    } catch (failure) {
      notify.error(failure);
    } finally {
      setBusy(false);
    }
  };

  const serviceStatus = service ? service.statusKey || service.status : null;

  return (
    <Box sx={content}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", pt: 2.5 }}>
        <RoundAvatar src={avatar} size={40} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}>
            {contact.nomeSecundario || "Cliente"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
            {contact.numero} · WhatsApp
          </Typography>
        </Box>
      </Stack>

      {client && service && <Overview data={data} service={service} />}

      <Section title="Cliente no Hubsoft" aside={service && <StatusChip kind="service" status={serviceStatus} label={service.status || undefined} />}>
        {!credentials && (
          <Alert severity="warning">
            O FOCUS Chat ainda não tem os dados de acesso ao Hubsoft. Peça para cadastrar as variáveis do sistema{" "}
            {Object.values(CREDENTIAL_VARIABLES).join(", ")} e abra o atendimento de novo.
          </Alert>
        )}

        {credentials && !client && (
          <Stack spacing={2.5}>
            <Alert severity="warning">
              {data.reason === "nao-encontrado"
                ? `Nenhum cliente com o documento ${data.document} no Hubsoft. Confira o número e busque de novo. Se ainda não é cliente, use a aba Cobertura.`
                : "Este contato ainda não tem CPF ou CNPJ cadastrado. Informe abaixo para buscar o cliente no Hubsoft."}
            </Alert>
            <TextField
              label="CPF ou CNPJ"
              value={document}
              onChange={(event) => setDocument(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && document.trim() && !busy && void locate()}
              placeholder="000.000.000-00"
              helperText="Do jeito que está no cadastro do Hubsoft"
              fullWidth
              disabled={busy}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { inputMode: "numeric", maxLength: 18 } }}
            />
            <Button variant="contained" size="large" startIcon={<Search />} onClick={() => void locate()} disabled={busy || !document.trim()} fullWidth>
              {busy ? "Buscando…" : "Localizar cliente"}
            </Button>
          </Stack>
        )}

        {client && (
          <Stack spacing={2.5}>
            {client.alerts.map((alert, index) => (
              <Alert key={index} severity="warning" icon={<Campaign fontSize="inherit" />}>
                {alert}
              </Alert>
            ))}
            <InfoGrid>
              <InfoItem label="Nome ou razão social" value={client.name} full />
              <InfoItem label="CPF ou CNPJ" value={client.document} copy />
              <InfoItem label="Código do cliente" value={client.code} />
              <InfoItem label="Telefone" value={client.phone} />
              <InfoItem label="E-mail" value={client.email} full />
            </InfoGrid>

            {service && needsUnlock(serviceStatus) && (
              <Alert severity="warning">
                O serviço está {(service.status || statusLabel(service.statusKey)).toLowerCase()}. Você pode liberar o acesso em confiança: o cliente volta a
                navegar na hora e o atendimento recebe uma nota interna.
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1.5, alignItems: { sm: "center" } }}>
                  <TextField select size="small" label="Prazo" value={days} onChange={(event) => setDays(Number(event.target.value))} sx={{ width: 140 }} disabled={busy}>
                    {UNLOCK_DAYS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option === 1 ? "1 dia" : `${option} dias`}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button variant="outlined" color="inherit" size="small" startIcon={<LockOpen />} onClick={() => void unlock()} disabled={busy}>
                    {busy ? "Desbloqueando…" : "Desbloquear em confiança"}
                  </Button>
                </Stack>
              </Alert>
            )}
          </Stack>
        )}
      </Section>

      {client && (
        <Section title={client.services.length === 1 ? "Serviço contratado" : `Serviços contratados (${client.services.length})`}>
          {client.services.length === 0 && <Typography color="text.secondary">Nenhum serviço ativo no cadastro do Hubsoft.</Typography>}
          <Stack spacing={2}>
            {client.services.map((item) => (
              <ServiceCard
                key={item.id}
                service={item}
                selected={item.id === service?.id}
                selectable={client.services.length > 1}
                onSelect={() => selectService(item.id)}
              />
            ))}
          </Stack>
        </Section>
      )}
    </Box>
  );
}

/** Três blocos que respondem de cara: está conectado? deve? tem chamado aberto? */
function Overview({ data, service }: { data: AttendanceData; service: Service }) {
  const connection = service.connection;
  const open = data.invoices.filter((invoice) => !invoice.paid);
  const overdue = open.filter((invoice) => invoice.status.toLowerCase().startsWith("vencid"));
  const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count === 1 ? singular : pluralForm}`;
  // "12/10/2026 08:14:02" → "12/10 08:14", para caber no bloco.
  const shortDate = (value: string) => value.replace(/^(\d{2}\/\d{2})\/\d{4}\s+(\d{2}:\d{2}).*$/, "$1 $2");

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        pt: 2.5,
        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
        "& > :last-child": { gridColumn: { xs: "1 / -1", sm: "auto" } },
      }}
    >
      <StatusTile
        icon={connection?.online ? <Wifi /> : <WifiOff />}
        title={connection ? (connection.online ? "Conectado" : "Desconectado") : "Conexão"}
        caption={
          connection
            ? connection.online
              ? connection.lastConnection
                ? `desde ${shortDate(connection.lastConnection)}`
                : "navegando agora"
              : connection.lastDisconnection
                ? `caiu ${shortDate(connection.lastDisconnection)}`
                : "sem sessão ativa"
            : "sem leitura do RADIUS"
        }
        color={connection ? (connection.online ? "success" : "error") : "default"}
        to="/conexao"
      />
      <StatusTile
        icon={<ReceiptLong />}
        title={open.length ? plural(open.length, "fatura", "faturas") : "Faturas em dia"}
        caption={open.length ? (overdue.length ? plural(overdue.length, "vencida", "vencidas") : "em aberto") : "nenhuma pendência"}
        color={overdue.length ? "error" : open.length ? "warning" : "success"}
        to="/financeiro"
      />
      <StatusTile
        icon={<SupportAgent />}
        title={data.openTickets ? plural(data.openTickets, "chamado aberto", "chamados abertos") : "Sem chamado aberto"}
        caption={data.openTickets ? "toque para acompanhar" : "toque para abrir um"}
        color={data.openTickets ? "warning" : "default"}
        to="/chamados"
      />
    </Box>
  );
}

function ServiceCard({ service, selected, selectable, onSelect }: { service: Service; selected: boolean; selectable: boolean; onSelect: () => void }) {
  const [showSecrets, setShowSecrets] = useState(false);
  const speed = [service.download, service.upload].filter(Boolean).join(" / ");
  const title = `${service.planNumber !== null ? `(${service.planNumber}) ` : ""}${service.name}`;
  const hasSecrets = service.login || service.password || service.passwords.length > 0;

  return (
    <OutlinedCard
      title={title}
      aside={
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <StatusChip kind="service" status={service.statusKey || service.status} label={service.status || undefined} />
          {selectable &&
            (selected ? (
              <Chip size="small" variant="outlined" color="primary" label="Em uso" />
            ) : (
              <Button size="small" onClick={onSelect} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
                Usar nas abas
              </Button>
            ))}
        </Stack>
      }
    >
      <InfoGrid columns={{ xs: "1fr 1fr" }}>
        <InfoItem label="Mensalidade" value={formatMoney(service.value)} />
        <InfoItem label="Download / upload" value={speed} />
        <InfoItem label="Tecnologia" value={service.technology} />
        <InfoItem label="Endereço de instalação" value={service.installAddress?.full} full />
      </InfoGrid>

      {hasSecrets && (
        <>
          <Button
            size="small"
            sx={{ textTransform: "none", mt: 1.5, ml: -1 }}
            startIcon={showSecrets ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowSecrets((current) => !current)}
          >
            {showSecrets ? "Esconder login e senhas" : "Ver login e senhas"}
          </Button>
          <Collapse in={showSecrets}>
            <Box sx={{ pt: 1.5 }}>
              <InfoGrid columns={{ xs: "1fr 1fr" }}>
                <InfoItem label="Login (PPPoE)" value={service.login} copy />
                <InfoItem label="Senha do login" value={service.password} secret copy />
                {service.passwords.map((item) => (
                  <InfoItem key={item.id} label={item.user ? `${item.description} · usuário ${item.user}` : item.description} value={item.password} secret copy />
                ))}
              </InfoGrid>
            </Box>
          </Collapse>
        </>
      )}
    </OutlinedCard>
  );
}
