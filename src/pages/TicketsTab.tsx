import Add from "@mui/icons-material/Add";
import ChatBubbleOutline from "@mui/icons-material/ChatBubbleOutlined";
import Send from "@mui/icons-material/Send";
import TaskAlt from "@mui/icons-material/TaskAlt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useAttendance } from "../attendance";
import { EmptyState, LoadState } from "../components/common";
import { content, contentTop } from "../components/layout";
import { OutlinedCard } from "../components/OutlinedCard";
import { Section } from "../components/Section";
import { StatusChip } from "../components/StatusChip";
import { useNotify } from "../components/useFeedback";
import { useLoad } from "../components/useLoad";
import { useNarrow } from "../components/useNarrow";
import { phoneDigits } from "../format";
import type { Service, ServiceOrder, Ticket } from "../model";
import { addNote, sendToContact } from "../services/attendance";
import { closeReasons, ticketStatuses, ticketTypes, whatsappOriginId } from "../services/catalog";
import type { HubsoftApi } from "../services/hubsoftApi";
import { toServiceOrder, toTicket } from "../services/mappers";

/** Aba Chamados: atendimentos e ordens de serviço do cliente no Hubsoft, com abertura pelo chat. */
export function TicketsTab() {
  const { data, api, service, setData } = useAttendance();
  const [showAll, setShowAll] = useState(false);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState<Ticket | null>(null);
  const client = data?.client ?? null;
  const document = client?.document ?? "";

  const tickets = useLoad(
    () => (client && api ? api.listTickets(document, !showAll).then((result) => (result.atendimentos ?? []).map(toTicket)) : Promise.resolve([] as Ticket[])),
    `${document}|${showAll}`,
  );
  const orders = useLoad(
    () => (client && api ? api.listServiceOrders(document).then((result) => (result.ordens_servico ?? []).map(toServiceOrder)) : Promise.resolve([] as ServiceOrder[])),
    document,
  );

  if (!data || !client || !api) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <EmptyState title="Nenhum cliente localizado">Localize o cliente na aba Cliente para ver os chamados.</EmptyState>
      </Box>
    );
  }

  const adjustOpenCount = (delta: number) => setData({ ...data, openTickets: Math.max(0, data.openTickets + delta) });

  return (
    <Box sx={content}>
      <Box sx={contentTop}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={showAll ? "todos" : "abertos"}
            onChange={(_event, value: "abertos" | "todos" | null) => value && setShowAll(value === "todos")}
          >
            <ToggleButton value="abertos" sx={{ px: 1.5 }}>
              Abertos
            </ToggleButton>
            <ToggleButton value="todos" sx={{ px: 1.5 }}>
              Todos
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => setCreating(true)}
            disabled={!service}
            sx={{ whiteSpace: "nowrap" }}
          >
            Novo chamado
          </Button>
        </Stack>

        <LoadState loading={tickets.loading} error={tickets.error} onRetry={() => void tickets.reload()} />
        {tickets.data && tickets.data.length === 0 && (
          <EmptyState title={showAll ? "Nenhum chamado registrado" : "Nenhum chamado aberto"}>
            {showAll ? "O cliente ainda não tem atendimentos no Hubsoft." : "Nada pendente para este cliente. Em Todos aparecem os já fechados."}
          </EmptyState>
        )}
        {tickets.data && tickets.data.length > 0 && (
          <Stack spacing={2}>
            {tickets.data.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} api={api} onChanged={() => void tickets.reload()} onClose={() => setClosing(ticket)} />
            ))}
          </Stack>
        )}
      </Box>

      <Section
        title="Ordens de serviço"
        aside={
          <Button size="small" sx={{ textTransform: "none", whiteSpace: "nowrap" }} onClick={() => void orders.reload()} disabled={orders.loading}>
            Atualizar
          </Button>
        }
      >
        <LoadState loading={orders.loading} error={orders.error} onRetry={() => void orders.reload()} />
        {orders.data && orders.data.length === 0 && <EmptyState title="Nenhuma ordem de serviço">O cliente não tem OS registradas no Hubsoft.</EmptyState>}
        {orders.data && orders.data.length > 0 && (
          <Stack spacing={2}>
            {orders.data.map((order) => (
              <OrderCard key={order.id} order={order} api={api} />
            ))}
          </Stack>
        )}
      </Section>

      {creating && service && (
        <NewTicketDialog
          api={api}
          service={service}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            adjustOpenCount(1);
            void tickets.reload();
          }}
        />
      )}
      {closing && (
        <CloseTicketDialog
          api={api}
          ticket={closing}
          onClose={() => setClosing(null)}
          onClosed={() => {
            setClosing(null);
            adjustOpenCount(-1);
            void tickets.reload();
          }}
        />
      )}
    </Box>
  );
}

/** Campo + botão para adicionar uma mensagem a um chamado ou OS, sem sair do cartão. */
function InlineMessage({ onSend }: { onSend: (message: string) => Promise<void> }) {
  const [writing, setWriting] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    try {
      await onSend(text);
      setMessage("");
      setWriting(false);
    } finally {
      setSending(false);
    }
  };

  if (!writing) {
    return (
      <Button size="small" sx={{ textTransform: "none" }} startIcon={<ChatBubbleOutline />} onClick={() => setWriting(true)}>
        Adicionar mensagem
      </Button>
    );
  }
  return (
    <Stack spacing={1.5} sx={{ width: "100%" }}>
      <TextField
        label="Mensagem"
        multiline
        minRows={2}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        autoFocus
        fullWidth
        placeholder="O que o cliente informou agora"
        slotProps={{ inputLabel: { shrink: true } }}
        disabled={sending}
      />
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <Button onClick={() => setWriting(false)} disabled={sending}>
          Cancelar
        </Button>
        <Button variant="contained" startIcon={<Send />} onClick={() => void submit()} disabled={sending || !message.trim()}>
          {sending ? "Enviando…" : "Adicionar"}
        </Button>
      </Stack>
    </Stack>
  );
}

function TicketCard({ ticket, api, onChanged, onClose }: { ticket: Ticket; api: HubsoftApi; onChanged: () => void; onClose: () => void }) {
  const { attendance } = useAttendance();
  const notify = useNotify();

  const addMessage = async (message: string) => {
    try {
      await api.addTicketMessage(ticket.id, message);
      await addNote(attendance, `Mensagem adicionada ao chamado ${ticket.protocol} no Hubsoft.`);
      notify.success("Mensagem adicionada ao chamado");
      onChanged();
    } catch (failure) {
      notify.error(failure);
      throw failure;
    }
  };

  return (
    <OutlinedCard title={`Protocolo ${ticket.protocol}`} aside={<StatusChip kind="ticket" status={ticket.open ? "aberto" : "fechado"} label={ticket.status} />}>
      <Typography sx={{ fontWeight: 700 }}>{ticket.type}</Typography>
      {ticket.openingDescription && (
        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
          {ticket.openingDescription}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Aberto em {ticket.createdAt ?? "—"}
        {ticket.openedBy ? ` por ${ticket.openedBy}` : ""}
        {ticket.responsible ? ` · responsável: ${ticket.responsible}` : ""}
        {ticket.serviceName ? ` · ${ticket.serviceName}` : ""}
      </Typography>
      {!ticket.open && (
        <Typography variant="body2" color="text.secondary">
          Fechado em {ticket.closedAt}
          {ticket.closeReason ? ` · ${ticket.closeReason}` : ""}
          {ticket.closingDescription ? `: ${ticket.closingDescription}` : ""}
        </Typography>
      )}

      {ticket.orders.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            Ordens de serviço vinculadas
          </Typography>
          <Stack spacing={0.75}>
            {ticket.orders.map((order) => (
              <Stack key={order.id} direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Typography variant="body2">
                  OS {order.number} · {order.type}
                  {order.scheduledStart ? ` · ${order.scheduledStart}` : ""}
                </Typography>
                <StatusChip kind="order" status={order.status} />
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {ticket.messages.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            Mensagens
          </Typography>
          <Stack spacing={1}>
            {ticket.messages.map((item, index) => (
              <Box key={index} sx={{ p: 1.5, bgcolor: "background.default", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {item.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {[item.user, item.createdAt].filter(Boolean).join(" · ")}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {ticket.open && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 2, ml: -1, alignItems: "flex-start" }}>
          <InlineMessage onSend={addMessage} />
          <Button size="small" sx={{ textTransform: "none" }} startIcon={<TaskAlt />} onClick={onClose}>
            Fechar chamado
          </Button>
        </Stack>
      )}
    </OutlinedCard>
  );
}

function OrderCard({ order, api }: { order: ServiceOrder; api: HubsoftApi }) {
  const { attendance } = useAttendance();
  const notify = useNotify();
  const finished = order.status.toLowerCase() === "finalizado";

  const addMessage = async (message: string) => {
    try {
      await api.addServiceOrderMessage(order.id, message);
      await addNote(attendance, `Mensagem adicionada à OS ${order.number} no Hubsoft.`);
      notify.success("Mensagem adicionada à OS");
    } catch (failure) {
      notify.error(failure);
      throw failure;
    }
  };

  return (
    <OutlinedCard title={`OS ${order.number} · ${order.type}`} aside={<StatusChip kind="order" status={order.status} />}>
      {order.serviceDescription && (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {order.serviceDescription}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Aberta em {order.createdAt ?? "—"}
        {order.openedBy ? ` por ${order.openedBy}` : ""}
      </Typography>
      {order.scheduledStart && (
        <Typography variant="body2" color="text.secondary">
          Programada para {order.scheduledStart}
          {order.scheduledEnd ? ` até ${order.scheduledEnd}` : ""}
        </Typography>
      )}
      {order.executedStart && (
        <Typography variant="body2" color="text.secondary">
          Executada em {order.executedStart}
          {order.executedEnd ? ` até ${order.executedEnd}` : ""}
          {order.closeStatus ? ` · ${order.closeStatus}` : ""}
        </Typography>
      )}
      {order.closingDescription && (
        <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
          Fechamento: {order.closingDescription}
        </Typography>
      )}
      {!finished && (
        <Box sx={{ mt: 2, ml: -1 }}>
          <InlineMessage onSend={addMessage} />
        </Box>
      )}
    </OutlinedCard>
  );
}

function NewTicketDialog({ api, service, onClose, onCreated }: { api: HubsoftApi; service: Service; onClose: () => void; onCreated: () => void }) {
  const { attendance, data } = useAttendance();
  const notify = useNotify();
  const narrow = useNarrow();
  const client = data?.client ?? null;
  const catalogs = useLoad(() => Promise.all([ticketTypes(api), ticketStatuses(api)]).then(([types, statuses]) => ({ types, statuses })));
  const [typeId, setTypeId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [description, setDescription] = useState("");
  const [notifyClient, setNotifyClient] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const origin = await whatsappOriginId(api);
      const result = await api.openTicket({
        id_cliente_servico: service.id,
        id_tipo_atendimento: typeId ? Number(typeId) : undefined,
        id_atendimento_status: statusId ? Number(statusId) : undefined,
        descricao: description.trim(),
        nome: client.name,
        telefone: phoneDigits(client.phone) || phoneDigits(attendance.contato.numero),
        email: client.email ?? undefined,
        id_origem_contato: origin ?? undefined,
        parametros: { origem: "FOCUS Chat", atendimento_focus_chat: attendance.atendimentoId, whatsapp: attendance.contato.numero },
      });
      const protocol = result.atendimento?.protocolo ? String(result.atendimento.protocolo) : null;
      await addNote(attendance, protocol ? `Chamado aberto no Hubsoft pelo atendente. Protocolo ${protocol}.` : "Chamado aberto no Hubsoft pelo atendente.");
      if (notifyClient && protocol) {
        await sendToContact(attendance, `Seu atendimento foi registrado. Protocolo: ${protocol}. Guarde este número para acompanhar.`);
      }
      notify.success(protocol ? `Chamado aberto. Protocolo ${protocol}` : "Chamado aberto no Hubsoft");
      onCreated();
    } catch (failure) {
      notify.error(failure);
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth fullScreen={narrow}>
      <DialogTitle>Novo chamado no Hubsoft</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Serviço: {service.planNumber !== null ? `(${service.planNumber}) ` : ""}
            {service.name}
          </Typography>
          <TextField
            label="O que o cliente relatou"
            multiline
            minRows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            autoFocus
            required
            fullWidth
            placeholder="Ex.: sem internet desde ontem à noite, já reiniciou o roteador"
            helperText="Vai para o histórico do cliente no Hubsoft"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <LoadState loading={catalogs.loading} error={catalogs.error} onRetry={() => void catalogs.reload()} />
          {catalogs.data && (
            <>
              <TextField select label="Tipo de atendimento" value={typeId} onChange={(event) => setTypeId(event.target.value)} fullWidth helperText="Sem escolher, o Hubsoft usa o tipo padrão (SAC)">
                <MenuItem value="">Padrão do Hubsoft</MenuItem>
                {catalogs.data.types.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Situação inicial"
                value={statusId}
                onChange={(event) => setStatusId(event.target.value)}
                fullWidth
                helperText="Situações marcadas com (Abertura de OS) já criam uma ordem de serviço"
              >
                <MenuItem value="">Padrão do Hubsoft</MenuItem>
                {catalogs.data.statuses.map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}
          <FormControlLabel
            control={<Checkbox checked={notifyClient} onChange={(event) => setNotifyClient(event.target.checked)} />}
            label="Enviar o número do protocolo pro cliente na conversa"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={() => void submit()} disabled={saving || !description.trim()}>
          {saving ? "Abrindo…" : "Abrir chamado"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CloseTicketDialog({ api, ticket, onClose, onClosed }: { api: HubsoftApi; ticket: Ticket; onClose: () => void; onClosed: () => void }) {
  const { attendance } = useAttendance();
  const notify = useNotify();
  const narrow = useNarrow();
  const reasons = useLoad(() => closeReasons(api));
  const [reasonId, setReasonId] = useState("");
  const [description, setDescription] = useState("Atendimento concluído pelo FOCUS Chat.");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.closeTicket(ticket.id, { id_motivo_fechamento_atendimento: reasonId ? Number(reasonId) : undefined, descricao_fechamento: description.trim() });
      await addNote(attendance, `Chamado ${ticket.protocol} fechado no Hubsoft pelo atendente.`);
      notify.success(`Chamado ${ticket.protocol} fechado`);
      onClosed();
    } catch (failure) {
      notify.error(failure);
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth fullScreen={narrow}>
      <DialogTitle>Fechar o chamado {ticket.protocol}?</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <LoadState loading={reasons.loading} error={reasons.error} onRetry={() => void reasons.reload()} />
          {reasons.data && (
            <TextField select label="Motivo do fechamento" value={reasonId} onChange={(event) => setReasonId(event.target.value)} fullWidth helperText="Sem escolher, o Hubsoft usa o motivo padrão">
              <MenuItem value="">Padrão do Hubsoft</MenuItem>
              {reasons.data.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label="Descrição do fechamento"
            multiline
            minRows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={() => void submit()} disabled={saving || !description.trim()}>
          {saving ? "Fechando…" : "Fechar chamado"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
