import Campaign from "@mui/icons-material/Campaign";
import LockOpen from "@mui/icons-material/LockOpen";
import Search from "@mui/icons-material/Search";
import WhatsApp from "@mui/icons-material/WhatsApp";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useAttendance } from "../attendance";
import { RoundAvatar } from "../components/common";
import { twoColumns } from "../components/layout";
import { OutlinedCard } from "../components/OutlinedCard";
import { ReadOnlyField } from "../components/ReadOnlyField";
import { Section } from "../components/Section";
import { StatusChip } from "../components/StatusChip";
import { useConfirm, useNotify } from "../components/useFeedback";
import { formatMoney } from "../format";
import type { Service } from "../model";
import { addNote, CREDENTIAL_VARIABLES, lookupClient, saveDocument } from "../services/attendance";
import { needsUnlock, statusLabel } from "../status";

const UNLOCK_DAYS = [1, 2, 3, 5, 7];

/** Aba Cliente: quem está na conversa, o cadastro no Hubsoft e os serviços contratados. */
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

      <Section title="Cliente no Hubsoft" aside={service && <StatusChip kind="service" status={serviceStatus} label={service.status || undefined} />}>
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
                ? `Nenhum cliente com o documento ${data.document} no Hubsoft. Confira o número e busque de novo. Se ainda não é cliente, use a aba Cobertura.`
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

        {client && (
          <Stack spacing={3}>
            {client.alerts.map((alert, index) => (
              <Alert key={index} severity="warning" icon={<Campaign fontSize="inherit" />}>
                {alert}
              </Alert>
            ))}
            <Box sx={twoColumns}>
              <ReadOnlyField label="Nome ou razão social" value={client.name} full />
              <ReadOnlyField label="CPF ou CNPJ" value={client.document} copy />
              <ReadOnlyField label="Código do cliente" value={client.code} />
              <ReadOnlyField label="Telefone" value={client.phone} />
              <ReadOnlyField label="E-mail" value={client.email} />
            </Box>

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

function ServiceCard({ service, selected, selectable, onSelect }: { service: Service; selected: boolean; selectable: boolean; onSelect: () => void }) {
  const speed = [service.download && `${service.download} de download`, service.upload && `${service.upload} de upload`].filter(Boolean).join(", ");
  const title = `${service.planNumber !== null ? `(${service.planNumber}) ` : ""}${service.name}`;
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
              <Button size="small" onClick={onSelect} sx={{ textTransform: "none" }}>
                Usar nas abas
              </Button>
            ))}
        </Stack>
      }
    >
      <Box sx={twoColumns}>
        <ReadOnlyField label="Mensalidade" value={formatMoney(service.value)} />
        <ReadOnlyField label="Tecnologia e velocidade" value={[service.technology, speed].filter(Boolean).join(" · ")} multiline />
        <ReadOnlyField label="Login (PPPoE)" value={service.login} copy />
        <ReadOnlyField label="Senha do login" value={service.password} secret copy />
        <ReadOnlyField label="Endereço de instalação" value={service.installAddress?.full} full multiline />
      </Box>
      {service.passwords.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Senhas cadastradas no serviço (Wi-Fi, roteador…)
          </Typography>
          <Box sx={twoColumns}>
            {service.passwords.map((item) => (
              <ReadOnlyField key={item.id} label={item.user ? `${item.description} · usuário ${item.user}` : item.description} value={item.password} secret copy />
            ))}
          </Box>
        </Box>
      )}
    </OutlinedCard>
  );
}
