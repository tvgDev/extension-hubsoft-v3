import LinkOff from "@mui/icons-material/LinkOff";
import Replay from "@mui/icons-material/Replay";
import RestartAlt from "@mui/icons-material/RestartAlt";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useAttendance } from "../attendance";
import { EmptyState, LoadState } from "../components/common";
import { InfoGrid, InfoItem } from "../components/InfoItem";
import { content } from "../components/layout";
import { OutlinedCard } from "../components/OutlinedCard";
import { Section } from "../components/Section";
import { StatusChip } from "../components/StatusChip";
import { useConfirm, useNotify } from "../components/useFeedback";
import { useLoad } from "../components/useLoad";
import { formatMegabytes } from "../format";
import type { Service } from "../model";
import { addNote } from "../services/attendance";
import type { HubsoftApi, RawEnvelope } from "../services/hubsoftApi";
import { toConnectionHistory, toCpe } from "../services/mappers";
import { signalColor, statusLabel } from "../status";

// Colunas que só cabem no desktop.
const wideOnly = { display: { xs: "none", md: "table-cell" } };

/** Aba Conexão: situação agora e as duas ações que resolvem a maioria dos casos; detalhes técnicos recolhidos. */
export function ConnectionTab() {
  const { data, api, service } = useAttendance();
  if (!data?.client || !api || !service) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <EmptyState title="Nenhum cliente localizado">Localize o cliente na aba Cliente para ver a conexão.</EmptyState>
      </Box>
    );
  }
  return (
    <Box sx={content}>
      <NowSection api={api} service={service} />
      <CpeSection api={api} service={service} />
      <Section title="Detalhes técnicos" defaultOpen={false}>
        <InfoGrid>
          <InfoItem label="Login (PPPoE)" value={service.login} copy />
          <InfoItem label="Último IP" value={service.connection?.lastIp ?? service.ipv4} copy />
          <InfoItem label="MAC autenticado" value={service.macAddr} copy />
          <InfoItem label="Concentrador" value={[service.concentrator, service.connection?.nasIp].filter(Boolean).join(" · ")} />
          <InfoItem label="OLT e interface" value={[service.olt, service.oltInterface].filter(Boolean).join(" · ")} />
          <InfoItem label="Última desconexão" value={service.connection?.lastDisconnection} />
        </InfoGrid>
      </Section>
      <HistorySection api={api} service={service} />
    </Box>
  );
}

function NowSection({ api, service }: { api: HubsoftApi; service: Service }) {
  const { attendance } = useAttendance();
  const notify = useNotify();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);
  const connection = service.connection;
  const chipStatus = connection ? (connection.online ? "conectado" : "desconectado") : null;

  const run = async (key: string, title: string, message: string, action: () => Promise<RawEnvelope>, note: string, done: string) => {
    const confirmed = await confirm({ title, message, confirmLabel: "Confirmar" });
    if (!confirmed) return;
    setBusy(key);
    try {
      await action();
      await addNote(attendance, note);
      notify.success(done);
    } catch (failure) {
      notify.error(failure);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Section title="Conexão agora" aside={<StatusChip kind="connection" status={chipStatus} label={chipStatus ? undefined : "Sem informação"} />}>
      <Stack spacing={2}>
        {connection ? (
          <Alert severity={connection.online ? "success" : "warning"}>
            {connection.online ? "Cliente navegando" : "Cliente sem conexão"}
            {connection.online && connection.lastConnection ? ` desde ${connection.lastConnection}` : ""}
            {!connection.online && connection.lastDisconnection ? ` desde ${connection.lastDisconnection}` : ""}
            {connection.lastIp ? ` · IP ${connection.lastIp}` : ""}
          </Alert>
        ) : (
          <Alert severity="info">O Hubsoft não informou a última conexão deste serviço. Isso depende do RADIUS do provedor estar reportando.</Alert>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<LinkOff />}
            disabled={busy !== null}
            onClick={() =>
              void run(
                "disconnect",
                "Forçar a reconexão?",
                "O cliente é desconectado e o roteador reconecta sozinho em instantes. Resolve a maioria dos casos de IP preso ou sessão travada.",
                () => api.disconnect(service.id),
                "Sessão do cliente derrubada pelo atendente (reconexão forçada).",
                "Reconexão forçada. O cliente volta a navegar em instantes.",
              )
            }
          >
            {busy === "disconnect" ? "Reconectando…" : "Forçar reconexão"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Replay />}
            disabled={busy !== null}
            onClick={() =>
              void run(
                "mac",
                "Liberar a troca de equipamento?",
                "Apaga o MAC autenticado no login, para um roteador ou ONU novo conseguir conectar com o mesmo login e senha.",
                () => api.resetMac(service.id),
                "MAC do login resetado pelo atendente (troca de equipamento liberada).",
                "Troca liberada. O novo equipamento já pode conectar.",
              )
            }
          >
            {busy === "mac" ? "Liberando…" : "Liberar troca de equipamento"}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Forçar reconexão derruba a sessão e o roteador volta sozinho. Liberar troca de equipamento serve quando o cliente trocou o roteador ou a ONU.
        </Typography>
      </Stack>
    </Section>
  );
}

function CpeSection({ api, service }: { api: HubsoftApi; service: Service }) {
  const { attendance } = useAttendance();
  const notify = useNotify();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);
  const cpes = useLoad(() => api.listCpes(service.id).then((result) => (result.cpes ?? []).map(toCpe)), String(service.id));

  const reboot = async (phyAddr: string) => {
    const confirmed = await confirm({
      title: "Reiniciar o equipamento?",
      message: "A ONU ou o roteador reinicia e o cliente fica sem internet por 1 a 2 minutos.",
      confirmLabel: "Reiniciar",
    });
    if (!confirmed) return;
    setBusy(phyAddr);
    try {
      await api.rebootCpe(phyAddr);
      await addNote(attendance, `Equipamento ${phyAddr} reiniciado pelo atendente.`);
      notify.success("Comando de reinício enviado. Aguarde 1 a 2 minutos.");
    } catch (failure) {
      notify.error(failure);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Section
      title="Equipamento do cliente"
      aside={
        <Button size="small" sx={{ textTransform: "none", whiteSpace: "nowrap" }} onClick={() => void cpes.reload()} disabled={cpes.loading}>
          Atualizar leitura
        </Button>
      }
    >
      <LoadState loading={cpes.loading} error={cpes.error} onRetry={() => void cpes.reload()} />
      {cpes.data && cpes.data.length === 0 && (
        <EmptyState title="Nenhum equipamento associado">O Hubsoft ainda não encontrou uma ONU ou roteador vinculado a este serviço.</EmptyState>
      )}
      {cpes.data && cpes.data.length > 0 && (
        <Stack spacing={2}>
          {cpes.data.map((cpe) => {
            const signal = signalColor(cpe.rxSignal);
            return (
              <OutlinedCard key={cpe.id} title={cpe.model ?? "Equipamento"} aside={<StatusChip kind="cpe" status={cpe.state} label={cpe.state ? statusLabel(cpe.state) : "Sem leitura"} />}>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Chip size="small" color={signal} label={`Sinal recebido ${cpe.rxSignal !== null ? `${cpe.rxSignal} dBm` : "—"}`} />
                  <Chip size="small" variant="outlined" label={`Sinal enviado ${cpe.txSignal !== null ? `${cpe.txSignal} dBm` : "—"}`} />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {signal === "success" && "Sinal bom: se o cliente reclama de lentidão, o problema não está na fibra."}
                  {signal === "warning" && "Sinal no limite: pode oscilar. Vale abrir chamado técnico se persistir."}
                  {signal === "error" && "Sinal ruim: problema na fibra ou no conector. Abra um chamado técnico."}
                  {signal === "default" && "Sem leitura de sinal. Toque em Atualizar leitura ou verifique se a ONU está ligada."}
                </Typography>
                <Button variant="contained" startIcon={<RestartAlt />} fullWidth sx={{ mt: 2 }} disabled={busy !== null || cpe.phyAddr === "—"} onClick={() => void reboot(cpe.phyAddr)}>
                  {busy === cpe.phyAddr ? "Reiniciando…" : "Reiniciar equipamento"}
                </Button>
                <Box sx={{ mt: 2.5 }}>
                  <InfoGrid columns={{ xs: "1fr 1fr" }}>
                    <InfoItem label="Serial" value={cpe.phyAddr} copy />
                    <InfoItem label="Última leitura" value={cpe.updatedAt} />
                    <InfoItem label="Interface na OLT" value={cpe.onuInterface} />
                    <InfoItem label="Distância da OLT" value={cpe.distance} />
                  </InfoGrid>
                </Box>
              </OutlinedCard>
            );
          })}
        </Stack>
      )}
    </Section>
  );
}

function HistorySection({ api, service }: { api: HubsoftApi; service: Service }) {
  return (
    <Section title="Últimas conexões" defaultOpen={false} lazy>
      {service.login ? (
        <History api={api} login={service.login} />
      ) : (
        <Typography color="text.secondary">Este serviço não tem login de autenticação, então não há histórico de conexões.</Typography>
      )}
    </Section>
  );
}

function History({ api, login }: { api: HubsoftApi; login: string }) {
  const history = useLoad(() => api.connectionHistory(login, 15).then(toConnectionHistory), login);
  return (
    <>
      <LoadState loading={history.loading} error={history.error} onRetry={() => void history.reload()} />
      {history.data && history.data.records.length === 0 && <EmptyState title="Nenhuma conexão nos últimos 30 dias" />}
      {history.data && history.data.records.length > 0 && (
        <>
          {history.data.totals && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {history.data.totals.connections} conexões nos últimos 30 dias · {formatMegabytes(history.data.totals.downloadMb)} baixados ·{" "}
              {formatMegabytes(history.data.totals.uploadMb)} enviados
            </Typography>
          )}
          <Table size="small" sx={{ "& th": { fontWeight: 700 }, "& th, & td": { px: 1 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Início</TableCell>
                <TableCell>Fim</TableCell>
                <TableCell sx={wideOnly}>IP</TableCell>
                <TableCell align="right">Download</TableCell>
                <TableCell align="right" sx={wideOnly}>
                  Upload
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.data.records.map((record, index) => (
                <TableRow key={index} hover>
                  <TableCell>{record.start ?? "—"}</TableCell>
                  <TableCell>{record.end ?? <Chip size="small" color="success" label="Ativa" />}</TableCell>
                  <TableCell sx={wideOnly}>{record.ip ?? "—"}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {formatMegabytes(record.downloadMb)}
                  </TableCell>
                  <TableCell align="right" sx={wideOnly}>
                    {formatMegabytes(record.uploadMb)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </>
  );
}
