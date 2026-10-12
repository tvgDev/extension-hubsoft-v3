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
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { useAttendance } from "../attendance";
import { EmptyState, LoadState, TabIntro } from "../components/common";
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
      <Box sx={{ p: 3 }}>
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
    <Box sx={{ px: 3, pb: 4 }}>
      <Box sx={{ pt: 3 }}>
        <TabIntro
          action={
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_event, value: "abertas" | "historico" | null) => value && setView(value)}>
              <ToggleButton value="abertas">Em aberto</ToggleButton>
              <ToggleButton value="historico">Histórico</ToggleButton>
            </ToggleButtonGroup>
          }
        >
          Faturas de {client.name} no Hubsoft. Envie o PIX, a linha digitável ou o PDF direto na conversa, ou peça ao Hubsoft para mandar por e-mail ou SMS.
        </TabIntro>

        {view === "abertas" && <InvoiceList invoices={data.invoices} emptyTitle="Nenhuma fatura em aberto" emptyText="O cliente está em dia no Hubsoft." {...cardProps} />}
        {view === "historico" && <InvoiceHistory api={api} document={client.document} {...cardProps} />}
      </Box>

      <FiscalNotesSection api={api} clientId={client.id} />
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
  const button = (item: InvoiceItem, icon: ReactNode, label: string, variant: "contained" | "outlined") => (
    <Button variant={variant} startIcon={icon} fullWidth disabled={busy} onClick={() => void onSend(item, invoice)}>
      {sending === `${invoice.id}:${item}` ? "Enviando…" : label}
    </Button>
  );

  return (
    <OutlinedCard title={`Vencimento ${invoice.dueDate}`} aside={<StatusChip kind="invoice" status={invoice.status} />}>
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "primary.main", lineHeight: 1.2 }}>{formatMoney(invoice.value)}</Typography>
      {invoice.serviceName && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {invoice.serviceName}
        </Typography>
      )}

      {invoice.lines.length > 0 && (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            Detalhamento
          </Typography>
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
        <>
          <Stack spacing={1.5} sx={{ mt: 3 }}>
            {invoice.pix && button("pix", <Pix />, "Enviar PIX", "contained")}
            {invoice.barcode && button("barcode", <ReceiptLong />, "Enviar linha digitável", "outlined")}
            {invoice.pdfUrl && button("pdf", <PictureAsPdf />, "Enviar PDF do boleto", "outlined")}
            {!invoice.pix && !invoice.barcode && !invoice.pdfUrl && (
              <Typography variant="body2" color="text.secondary">
                O Hubsoft não devolveu PIX, linha digitável nem PDF para esta fatura.
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 1.5 }}>
            <Button size="small" startIcon={<Email />} sx={{ textTransform: "none" }} disabled={busy} onClick={() => void onHubsoft("email", invoice)}>
              {sending === `${invoice.id}:email` ? "Enviando…" : "Enviar por e-mail"}
            </Button>
            <Button size="small" startIcon={<Sms />} sx={{ textTransform: "none" }} disabled={busy} onClick={() => void onHubsoft("sms", invoice)}>
              {sending === `${invoice.id}:sms` ? "Enviando…" : "Enviar por SMS"}
            </Button>
          </Stack>
        </>
      )}
    </OutlinedCard>
  );
}

function FiscalNotesSection({ api, clientId }: { api: HubsoftApi; clientId: number }) {
  return (
    <Section title="Notas fiscais" defaultOpen={false} lazy>
      <FiscalNotes api={api} clientId={clientId} />
    </Section>
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
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ "& th": { fontWeight: 700 }, "& th, & td": { whiteSpace: "nowrap", px: 1 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Número</TableCell>
                <TableCell>Emissão</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notes.data.map((note) => (
                <TableRow key={`${note.kind}-${note.id}`} hover>
                  <TableCell>{note.kindLabel}</TableCell>
                  <TableCell>
                    {note.number}
                    {note.series ? ` / ${note.series}` : ""}
                  </TableCell>
                  <TableCell>{note.issuedAt ?? "—"}</TableCell>
                  <TableCell align="right">{formatMoney(note.value)}</TableCell>
                  <TableCell>
                    <StatusChip kind="note" status={note.status} />
                  </TableCell>
                  <TableCell align="right">
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
        </Box>
      )}
    </>
  );
}
