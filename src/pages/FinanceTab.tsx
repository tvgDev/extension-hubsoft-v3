import CheckCircle from "@mui/icons-material/CheckCircle";
import PictureAsPdf from "@mui/icons-material/PictureAsPdf";
import Pix from "@mui/icons-material/Pix";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { useAttendance } from "../attendance";
import { EmptyState, TabIntro } from "../components/common";
import { OutlinedCard } from "../components/OutlinedCard";
import { StatusChip } from "../components/StatusChip";
import { useConfirm, useNotify } from "../components/useFeedback";
import { formatMoney } from "../format";
import type { Invoice } from "../model";
import { sendInvoiceItem, type InvoiceItem } from "../services/attendance";
import { isPaid } from "../status";

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

/** Aba Financeiro: faturas em aberto no Hubsoft, com envio direto na conversa. */
export function FinanceTab() {
  const { attendance, data } = useAttendance();
  const notify = useNotify();
  const confirm = useConfirm();
  const [sending, setSending] = useState<string | null>(null);
  if (!data) return null;

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

  return (
    <Box sx={{ p: 3 }}>
      {!data.client && <EmptyState title="Nenhum cliente localizado">Localize o cliente na aba Cliente para ver as faturas em aberto.</EmptyState>}

      {data.client && (
        <>
          <TabIntro>Faturas em aberto de {data.client.name} no Hubsoft. Envie o PIX, a linha digitável ou o PDF direto na conversa.</TabIntro>
          {data.invoices.length === 0 && <EmptyState title="Nenhuma fatura em aberto">O cliente está em dia no Hubsoft.</EmptyState>}
          <Stack spacing={2}>
            {data.invoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} sending={sending} onSend={send} />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}

function InvoiceCard({ invoice, sending, onSend }: { invoice: Invoice; sending: string | null; onSend: (item: InvoiceItem, invoice: Invoice) => Promise<void> }) {
  const paid = isPaid(invoice.status);
  const button = (item: InvoiceItem, icon: ReactNode, label: string, variant: "contained" | "outlined") => (
    <Button variant={variant} startIcon={icon} fullWidth disabled={sending !== null} onClick={() => void onSend(item, invoice)}>
      {sending === `${invoice.id}:${item}` ? "Enviando…" : label}
    </Button>
  );

  return (
    <OutlinedCard title={`Vencimento ${invoice.dueDate}`} aside={<StatusChip kind="invoice" status={invoice.status} />}>
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "primary.main", lineHeight: 1.2 }}>{formatMoney(invoice.value)}</Typography>

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

      {paid ? (
        <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: "center", color: "success.main" }}>
          <CheckCircle fontSize="small" />
          <Typography variant="body2">Pago em {invoice.paidAt ?? "data não informada"}</Typography>
        </Stack>
      ) : (
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
      )}
    </OutlinedCard>
  );
}
