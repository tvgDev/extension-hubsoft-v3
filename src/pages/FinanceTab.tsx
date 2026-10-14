import CheckCircle from "@mui/icons-material/CheckCircle";
import Email from "@mui/icons-material/Email";
import PictureAsPdf from "@mui/icons-material/PictureAsPdf";
import Pix from "@mui/icons-material/Pix";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Sms from "@mui/icons-material/Sms";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { useAttendance } from "../attendance";
import { EmptyState, LoadState } from "../components/common";
import { content, contentTop } from "../components/layout";
import { OutlinedCard } from "../components/OutlinedCard";
import { Section } from "../components/Section";
import { StatusChip } from "../components/StatusChip";
import { useConfirm, useNotify } from "../components/useFeedback";
import { useLoad } from "../components/useLoad";
import { daysAgo, daysBetween, formatMoney, isoDate } from "../format";
import type { FiscalNote, Invoice } from "../model";
import { addNote, sendInvoiceItem, type InvoiceItem } from "../services/attendance";
import type { HubsoftApi } from "../services/hubsoftApi";
import { toFiscalNotes, toInvoice } from "../services/mappers";

const ITEMS: Record<InvoiceItem, { label: string; confirm: string; done: string }> = {
  pix: {
    label: "o PIX",
    confirm: "A chave copia e cola e o QR Code vão para a conversa, e o atendimento recebe uma nota interna.",
    done: "PIX enviado na conversa",
  },
  barcode: {
    label: "a linha digitável",
    confirm: "A linha digitável do boleto vai para a conversa, e o atendimento recebe uma nota interna.",
    done: "Linha digitável enviada na conversa",
  },
  pdf: {
    label: "o PDF do boleto",
    confirm: "O boleto em PDF vai para a conversa, e o atendimento recebe uma nota interna.",
    done: "PDF do boleto enviado na conversa",
  },
};

type HubsoftChannel = "email" | "sms";

/** Aba Financeiro: faturas (em aberto e histórico), envio pela conversa ou pelo Hubsoft, notas fiscais. */
export function FinanceTab() {
  const { attendance, data, api } = useAttendance();
  const notify = useNotify();
  const confirm = useConfirm();
  const [view, setView] = useState<"abertas" | "historico">("abertas");
  const [sending, setSending] = useState<string | null>(null);
  if (!data) return null;

  const client = data.client;
  if (!client || !api) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <EmptyState title="Nenhum cliente localizado">Localize o cliente na aba Cliente para ver as faturas.</EmptyState>
      </Box>
    );
  }

  const send = async (item: InvoiceItem, invoice: Invoice) => {
    const confirmed = await confirm({ title: `Enviar ${ITEMS[item].label} ao cliente?`, message: ITEMS[item].confirm, confirmLabel: "Enviar" });
    if (!confirmed) return;
    setSending(`${invoice.id}:${item}`);
    try {
      await sendInvoiceItem(attendance, item, invoice);
      notify.success(ITEMS[item].done);
    } catch (failure) {
      notify.error(failure);
    } finally {
      setSending(null);
    }
  };

  const sendByHubsoft = async (channel: HubsoftChannel, invoice: Invoice) => {
    const label = channel === "email" ? "e-mail" : "SMS";
    const target = channel === "email" ? client.email : client.phone;
    const confirmed = await confirm({
      title: `Enviar a fatura por ${label}?`,
      message: `O Hubsoft envia a fatura com vencimento em ${invoice.dueDate} para ${target ?? "os contatos do cadastro"}. Pode levar alguns minutos para chegar.`,
      confirmLabel: "Enviar",
    });
    if (!confirmed) return;
    setSending(`${invoice.id}:${channel}`);
    try {
      await (channel === "email" ? api.sendInvoiceEmail(invoice.id) : api.sendInvoiceSms(invoice.id));
      await addNote(attendance, `Fatura com vencimento em ${invoice.dueDate} enviada por ${label} pelo Hubsoft.`);
      notify.success(`Fatura enviada por ${label}`);
    } catch (failure) {
      notify.error(failure);
    } finally {
      setSending(null);
    }
  };

  const cardProps = { sending, onSend: send, onHubsoft: sendByHubsoft };

  return (
    <Box sx={content}>
      <Box sx={contentTop}>
        <Stack direction="row" sx={{ mb: 2 }}>
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_event, value: "abertas" | "historico" | null) => value && setView(value)}>
            <ToggleButton value="abertas" sx={{ px: 2 }}>
              Em aberto
            </ToggleButton>
            <ToggleButton value="historico" sx={{ px: 2 }}>
              Histórico
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {view === "abertas" && <InvoiceList invoices={data.invoices} emptyTitle="Nenhuma fatura em aberto" emptyText="O cliente está em dia no Hubsoft." {...cardProps} />}
        {view === "historico" && <InvoiceHistory api={api} document={client.document} {...cardProps} />}
      </Box>

      <Section title="Notas fiscais" defaultOpen={false} lazy>
        <FiscalNotes api={api} clientId={client.id} />
      </Section>
    </Box>
  );
}

interface CardActions {
  sending: string | null;
  onSend: (item: InvoiceItem, invoice: Invoice) => Promise<void>;
  onHubsoft: (channel: HubsoftChannel, invoice: Invoice) => Promise<void>;
}

function InvoiceList({ invoices, emptyTitle, emptyText, ...actions }: { invoices: Invoice[]; emptyTitle: string; emptyText: string } & CardActions) {
  if (invoices.length === 0) return <EmptyState title={emptyTitle}>{emptyText}</EmptyState>;
  return (
    <Stack spacing={2}>
      {invoices.map((invoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} {...actions} />
      ))}
    </Stack>
  );
}

function InvoiceHistory({ api, document, ...actions }: { api: HubsoftApi; document: string } & CardActions) {
  const history = useLoad(() => api.listInvoices(document, false, 12).then((result) => (result.faturas ?? []).map(toInvoice)), document);
  return (
    <>
      <LoadState loading={history.loading} error={history.error} onRetry={() => void history.reload()} />
      {history.data && <InvoiceList invoices={history.data} emptyTitle="Nenhuma fatura registrada" emptyText="O Hubsoft não devolveu faturas para este cliente." {...actions} />}
    </>
  );
}

function InvoiceCard({ invoice, sending, onSend, onHubsoft }: { invoice: Invoice } & CardActions) {
  const busy = sending !== null;
  const options: Array<{ item: InvoiceItem; icon: ReactNode; label: string }> = [
    ...(invoice.pix ? [{ item: "pix" as const, icon: <Pix />, label: "Enviar PIX" }] : []),
    ...(invoice.barcode ? [{ item: "barcode" as const, icon: <ReceiptLong />, label: "Linha digitável" }] : []),
    ...(invoice.pdfUrl ? [{ item: "pdf" as const, icon: <PictureAsPdf />, label: "PDF do boleto" }] : []),
  ];
  // A primeira opção disponível vira o botão grande; as outras ficam pequenas embaixo.
  const [primary, ...secondary] = options;
  const sendingLabel = (key: string, label: string) => (sending === `${invoice.id}:${key}` ? "Enviando…" : label);

  return (
    <OutlinedCard title={`Vencimento ${invoice.dueDate}`} aside={<StatusChip kind="invoice" status={invoice.status} />}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "baseline", flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "primary.main", lineHeight: 1.2 }}>{formatMoney(invoice.value)}</Typography>
        {invoice.serviceName && (
          <Typography variant="body2" color="text.secondary">
            {invoice.serviceName}
          </Typography>
        )}
      </Stack>

      {invoice.lines.length > 0 && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
          {invoice.lines.map((line, index) => (
            <Stack key={index} direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                {line.description}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                {formatMoney(line.value)}
              </Typography>
            </Stack>
          ))}
        </Box>
      )}

      {invoice.paid ? (
        <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: "center", color: "success.main" }}>
          <CheckCircle fontSize="small" />
          <Typography variant="body2">
            Pago em {invoice.paidAt ?? "data não informada"}
            {invoice.paidValue !== null ? ` · ${formatMoney(invoice.paidValue)}` : ""}
          </Typography>
        </Stack>
      ) : (
        <Box sx={{ mt: 2.5 }}>
          {primary ? (
            <Button variant="contained" size="large" fullWidth startIcon={primary.icon} disabled={busy} onClick={() => void onSend(primary.item, invoice)}>
              {sendingLabel(primary.item, primary.item === "pix" ? "Enviar PIX" : `Enviar ${primary.label.toLowerCase()}`)}
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              O Hubsoft não devolveu PIX, linha digitável nem PDF para esta fatura.
            </Typography>
          )}
          <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap", mt: 1, ml: -1 }}>
            {secondary.map((option) => (
              <Button key={option.item} size="small" startIcon={option.icon} sx={{ textTransform: "none" }} disabled={busy} onClick={() => void onSend(option.item, invoice)}>
                {sendingLabel(option.item, option.label)}
              </Button>
            ))}
            <Button size="small" startIcon={<Email />} sx={{ textTransform: "none" }} disabled={busy} onClick={() => void onHubsoft("email", invoice)}>
              {sendingLabel("email", "E-mail")}
            </Button>
            <Button size="small" startIcon={<Sms />} sx={{ textTransform: "none" }} disabled={busy} onClick={() => void onHubsoft("sms", invoice)}>
              {sendingLabel("sms", "SMS")}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            E-mail e SMS saem pelo Hubsoft para o cadastro do cliente
          </Typography>
        </Box>
      )}
    </OutlinedCard>
  );
}

function FiscalNotes({ api, clientId }: { api: HubsoftApi; clientId: number }) {
  const { attendance } = useAttendance();
  const notify = useNotify();
  const confirm = useConfirm();
  const [from, setFrom] = useState(() => isoDate(daysAgo(60)));
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [range, setRange] = useState(() => ({ from: isoDate(daysAgo(60)), to: isoDate(new Date()) }));
  const [sending, setSending] = useState<number | null>(null);
  const notes = useLoad(() => api.listFiscalNotes(clientId, range.from, range.to).then(toFiscalNotes), `${range.from}|${range.to}`);

  const search = () => {
    if (!from || !to || daysBetween(from, to) < 0) {
      notify.error("Confira as datas: o início precisa vir antes do fim.");
      return;
    }
    if (daysBetween(from, to) > 60) {
      notify.error("O Hubsoft só busca períodos de até 60 dias. Reduza o intervalo.");
      return;
    }
    setRange({ from, to });
  };

  const sendEmail = async (note: FiscalNote) => {
    const confirmed = await confirm({
      title: "Enviar a nota por e-mail?",
      message: `O Hubsoft envia a ${note.kindLabel} ${note.number} para o e-mail do cadastro do cliente.`,
      confirmLabel: "Enviar",
    });
    if (!confirmed) return;
    setSending(note.id);
    try {
      await api.sendFiscalNoteEmail(note.id, note.kind);
      await addNote(attendance, `${note.kindLabel} ${note.number} enviada por e-mail pelo Hubsoft.`);
      notify.success("Nota enviada por e-mail");
    } catch (failure) {
      notify.error(failure);
    } finally {
      setSending(null);
    }
  };

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 1, alignItems: { sm: "center" } }}>
        <TextField type="date" size="small" label="Emitidas de" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="date" size="small" label="até" value={to} onChange={(event) => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <Button variant="outlined" onClick={search} sx={{ flexShrink: 0 }} disabled={notes.loading}>
          Buscar notas
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 3 }}>
        O Hubsoft só devolve notas já autorizadas e períodos de até 60 dias
      </Typography>

      <LoadState loading={notes.loading} error={notes.error} onRetry={() => void notes.reload()} />
      {notes.data && notes.data.length === 0 && <EmptyState title="Nenhuma nota no período">Tente outro intervalo de datas.</EmptyState>}
      {notes.data && notes.data.length > 0 && (
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 320, "& th": { fontWeight: 700 }, "& th, & td": { px: 1 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Nota</TableCell>
                <TableCell>Emissão</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Situação</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notes.data.map((note) => (
                <TableRow key={`${note.kind}-${note.id}`} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {note.kindLabel} {note.number}
                    </Typography>
                    {note.series && (
                      <Typography variant="caption" color="text.secondary">
                        série {note.series}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{note.issuedAt ?? "—"}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {formatMoney(note.value)}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <StatusChip kind="note" status={note.status} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {note.pdfUrl && (
                      <Tooltip title="Abrir PDF">
                        <IconButton size="small" component={Link} href={note.pdfUrl} target="_blank" rel="noopener" aria-label="Abrir PDF da nota">
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Enviar por e-mail">
                      <span>
                        <IconButton size="small" onClick={() => void sendEmail(note)} disabled={sending !== null || note.canceled} aria-label="Enviar nota por e-mail">
                          <Email fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
