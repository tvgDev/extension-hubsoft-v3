import LinkOff from "@mui/icons-material/LinkOff";
import OpenInNew from "@mui/icons-material/OpenInNew";
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
import TableContainer from "@mui/material/TableContainer";
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
import { ApiError } from "../services/http";
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
  // IP pelo qual o roteador do cliente pode ser acessado de fora (quando o provedor libera).
  const routerIp = connection?.lastIp ?? service.ipv4;

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

        {routerIp ? (
          <Box>
            <Button
              variant="outlined"
              fullWidth
              component="a"
              href={`http://${routerIp}`}
              target="_blank"
              rel="noopener"
              startIcon={<OpenInNew />}
              onClick={() => void addNote(attendance, `Painel do roteador aberto pelo atendente (http://${routerIp}).`)}
            >
              Abrir painel do roteador
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              Abre http://{routerIp} em outra aba. Só funciona quando o provedor libera o acesso remoto ao roteador nesse IP.
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Sem IP atual do cliente, não dá para abrir o painel do roteador. Peça uma reconexão e atualize a leitura.
          </Typography>
        )}
      </Stack>
    </Section>
  );
}

function CpeSection({ api, service }: { api: HubsoftApi; service: Service }) {
  const { attendance } = useAttendance();
  const notify = useNotify();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<string | null>(null);
  // Identificadores do equipamento que o cadastro do serviço já traz (serial e MAC).
  const serviceIds = [service.phyAddr, service.macAddr].filter((value): value is string => Boolean(value));

  // Primeiro pelo serviço; se o Hubsoft não vincula a CPE ao serviço, tenta pelo serial/MAC do cadastro.
  const cpes = useLoad(async () => {
    const byService = ((await api.listCpes(service.id)).cpes ?? []).map(toCpe);
    if (byService.length > 0) return byService;
    for (const id of serviceIds) {
      const found = ((await api.listCpesByPhyAddr(id)).cpes ?? []).map(toCpe);
      if (found.length > 0) return found;
    }
    return byService;
  }, String(service.id));

  const notFound = (failure: unknown) => failure instanceof ApiError && /n[aã]o encontrad/i.test(failure.message);

  /** Tenta reiniciar pelo identificador da CPE e, se o Hubsoft não reconhecer, pelo serial e MAC do serviço. */
  const reboot = async (primary: string | null) => {
    const candidates = [primary, ...serviceIds].filter((value, index, all): value is string => Boolean(value) && value !== "—" && all.indexOf(value) === index);
    if (candidates.length === 0) {
      notify.error("O Hubsoft não informou serial nem MAC deste equipamento, então não dá para reiniciar por aqui.");
      return;
    }
    const confirmed = await confirm({
      title: "Reiniciar o equipamento?",
      message: "A ONU ou o roteador reinicia e o cliente fica sem internet por 1 a 2 minutos.",
      confirmLabel: "Reiniciar",
    });
    if (!confirmed) return;
    setBusy(candidates[0]);
    try {
      let lastFailure: unknown = null;
      let used: string | null = null;
      for (const id of candidates) {
        try {
          await api.rebootCpe(id);
          used = id;
          break;
        } catch (failure) {
          lastFailure = failure;
          if (!notFound(failure)) throw failure;
        }
      }
      if (!used) throw lastFailure ?? new Error("Não foi possível reiniciar o equipamento.");
      await addNote(attendance, `Equipamento ${used} reiniciado pelo atendente.`);
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
      {cpes.data && cpes.data.length === 0 && serviceIds.length === 0 && (
        <EmptyState title="Nenhum equipamento associado">O Hubsoft ainda não encontrou uma ONU ou roteador vinculado a este serviço.</EmptyState>
      )}
      {cpes.data && cpes.data.length === 0 && serviceIds.length > 0 && (
        <OutlinedCard title="Equipamento do cadastro" aside={<StatusChip kind="cpe" status={null} label="Sem leitura" />}>
          <Typography variant="body2" color="text.secondary">
            O Hubsoft não devolveu a leitura de sinal deste equipamento, mas o serviço tem serial e MAC cadastrados. Dá para mandar reiniciar mesmo assim.
          </Typography>
          <Button variant="contained" startIcon={<RestartAlt />} fullWidth sx={{ mt: 2 }} disabled={busy !== null} onClick={() => void reboot(null)}>
            {busy !== null ? "Reiniciando…" : "Reiniciar equipamento"}
          </Button>
          <Box sx={{ mt: 2.5 }}>
            <InfoGrid columns={{ xs: "1fr 1fr" }}>
              <InfoItem label="Serial" value={service.phyAddr} copy />
              <InfoItem label="MAC" value={service.macAddr} copy />
            </InfoGrid>
          </Box>
        </OutlinedCard>
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
                <Button variant="contained" startIcon={<RestartAlt />} fullWidth sx={{ mt: 2 }} disabled={busy !== null} onClick={() => void reboot(cpe.phyAddr)}>
                  {busy !== null ? "Reiniciando…" : "Reiniciar equipamento"}
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
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 320, "& th": { fontWeight: 700 }, "& th, & td": { px: 1 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Início</TableCell>
                  <TableCell>Fim</TableCell>
                  <TableCell sx={wideOnly}>IP</TableCell>
                  <TableCell align="right">Download</TableCell>
                  <TableCell align="right">Upload</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.data.records.map((record, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{record.start ?? "—"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{record.end ?? <Chip size="small" color="success" label="Ativa" />}</TableCell>
                    <TableCell sx={{ ...wideOnly, whiteSpace: "nowrap" }}>{record.ip ?? "—"}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {formatMegabytes(record.downloadMb)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {formatMegabytes(record.uploadMb)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
}
