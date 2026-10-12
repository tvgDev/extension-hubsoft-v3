import LockOpen from "@mui/icons-material/LockOpen";
import Search from "@mui/icons-material/Search";
import WhatsApp from "@mui/icons-material/WhatsApp";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useAttendance } from "../attendance";
import { RoundAvatar } from "../components/common";
import { Section } from "../components/Section";
import { useConfirm, useNotify } from "../components/useFeedback";
import { StatusChip } from "../components/StatusChip";
import type { HubsoftClient } from "../model";
import { CREDENTIAL_VARIABLES, lookupClient, saveDocument, unlockInTrust } from "../services/attendance";
import { needsUnlock, statusLabel } from "../status";

// Grade de dois campos lado a lado, um por linha quando o painel é estreito.
const twoColumns = { display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } };
const fullRow = { gridColumn: "1 / -1" };

/** Aba Cliente: quem está na conversa e o cadastro dele no Hubsoft. */
export function ClientTab() {
  const { attendance, data, setData } = useAttendance();
  const notify = useNotify();
  const confirm = useConfirm();
  const [document, setDocument] = useState("");
  const [busy, setBusy] = useState(false);
  if (!data) return null;

  const { credentials, client } = data;
  const contact = attendance.contato;
  const avatar = contact.linkImagem && !contact.linkImagem.includes("undefined") ? contact.linkImagem : null;

  const locate = async () => {
    const value = document.trim();
    if (!credentials || !value) return;
    setBusy(true);
    try {
      const found = await lookupClient(credentials, value);
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
    if (!credentials || !client || client.serviceId === null) return;
    const confirmed = await confirm({
      title: "Desbloquear em confiança?",
      message: "O serviço volta a funcionar na hora e o atendimento recebe uma nota interna avisando. Use quando o cliente combinou o pagamento.",
      confirmLabel: "Desbloquear",
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await unlockInTrust(attendance, credentials, client.serviceId);
      setData({ ...data, client: { ...client, status: "ativo" } });
      notify.success("Serviço desbloqueado em confiança");
    } catch (failure) {
      notify.error(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ px: 3, pb: 4 }}>
      <Section title="Atendimento">
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <RoundAvatar src={avatar} size={64} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }} noWrap>
              {contact.nomeSecundario || "Cliente"}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}>
              <WhatsApp sx={{ fontSize: 18 }} />
              <Typography variant="body2">{contact.numero}</Typography>
            </Stack>
          </Box>
        </Stack>
      </Section>

      <Section title="Cliente no Hubsoft" aside={client && <StatusChip kind="service" status={client.status} />}>
        {!credentials && (
          <Alert severity="warning">
            O FOCUS Chat ainda não tem os dados de acesso ao Hubsoft. Peça para cadastrar as variáveis do sistema{" "}
            {Object.values(CREDENTIAL_VARIABLES).join(", ")} e abra o atendimento de novo.
          </Alert>
        )}

        {credentials && !client && (
          <Stack spacing={3}>
            <Alert severity="warning">
              {data.reason === "nao-encontrado"
                ? `Nenhum cliente com o documento ${data.document} no Hubsoft. Confira o número e busque de novo.`
                : "Este contato ainda não tem CPF ou CNPJ cadastrado. Informe abaixo para buscar o cliente no Hubsoft."}
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "flex-start" } }}>
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
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={() => void locate()}
                disabled={busy || !document.trim()}
                sx={{ flexShrink: 0, minWidth: 180, height: 56 }}
              >
                {busy ? "Buscando…" : "Localizar cliente"}
              </Button>
            </Stack>
          </Stack>
        )}

        {client && <ClientFields client={client} />}

        {client && needsUnlock(client.status) && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            O serviço está {statusLabel(client.status ?? "").toLowerCase()}. Você pode liberar o acesso em confiança: o cliente volta a navegar na
            hora e o atendimento recebe uma nota interna.
            <Box sx={{ mt: 1.5 }}>
              <Button variant="outlined" color="inherit" size="small" startIcon={<LockOpen />} onClick={() => void unlock()} disabled={busy || client.serviceId === null}>
                {busy ? "Desbloqueando…" : "Desbloquear em confiança"}
              </Button>
            </Box>
          </Alert>
        )}
      </Section>
    </Box>
  );
}

/** Cadastro do Hubsoft em campos só de leitura, no mesmo formato dos formulários do painel. */
function ClientFields({ client }: { client: HubsoftClient }) {
  const field = (label: string, value: string | null, options: { full?: boolean; multiline?: boolean } = {}) => (
    <TextField
      label={label}
      value={value || "—"}
      multiline={options.multiline}
      fullWidth
      slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
      sx={options.full ? fullRow : undefined}
    />
  );
  return (
    <Box sx={twoColumns}>
      {field("Nome ou razão social", client.name, { full: true })}
      {field("CPF ou CNPJ", client.document)}
      {field("Telefone", client.phone)}
      {field("E-mail", client.email)}
      {field("Plano", client.plan)}
      {field("Endereço de instalação", client.address, { full: true, multiline: true })}
    </Box>
  );
}
