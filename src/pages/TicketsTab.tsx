import Add from "@mui/icons-material/Add";
import ArrowBack from "@mui/icons-material/ArrowBack";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import ChatBubbleOutline from "@mui/icons-material/ChatBubbleOutlined";
import Send from "@mui/icons-material/Send";
import TaskAlt from "@mui/icons-material/TaskAlt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
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
import { defaultEndTime, formatBrDate, isoDate, phoneDigits } from "../format";
import type { Service, ServiceOrder, Ticket } from "../model";
import { addNote, sendToContact } from "../services/attendance";
import { closeReasons, ticketStatuses, ticketTypes, whatsappOriginId } from "../services/catalog";
import { errorMessage } from "../services/http";
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

  if (creating && service) {
    return (
      <NewTicketView
        api={api}
        service={service}
        onBack={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          adjustOpenCount(1);
          void tickets.reload();
        }}
      />
    );
  }

  if (closing) {
    return (
      <CloseTicketView
        api={api}
        ticket={closing}
        onBack={() => setClosing(null)}
        onClosed={() => {
          setClosing(null);
          adjustOpenCount(-1);
          void tickets.reload();
        }}
      />
    );
  }

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
  const [openingOrder, setOpeningOrder] = useState(false);

  const handleOpenOrder = async () => {
    setOpeningOrder(true);
    try {
      await api.openServiceOrder(ticket.id);
      await addNote(attendance, `Ordem de Serviço aberta no Hubsoft para o chamado ${ticket.protocol}.`);
      notify.success("Ordem de Serviço aberta com sucesso");
      onChanged();
    } catch (failure) {
      notify.error(failure);
    } finally {
      setOpeningOrder(false);
    }
  };

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
          {ticket.orders.length === 0 && (
            <Button
              size="small"
              sx={{ textTransform: "none" }}
              startIcon={<AssignmentOutlined />}
              onClick={() => void handleOpenOrder()}
              disabled={openingOrder}
            >
              {openingOrder ? "Abrindo OS…" : "Abrir OS"}
            </Button>
          )}
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

const SELECT_MENU_PROPS = {
  slotProps: {
    paper: {
      sx: { maxHeight: 280 },
    },
  },
};

function NewTicketView({
  api,
  service,
  onBack,
  onCreated,
}: {
  api: HubsoftApi;
  service: Service;
  onBack: () => void;
  onCreated: () => void;
}) {
  const { attendance, data } = useAttendance();
  const notify = useNotify();
  const client = data?.client ?? null;
  const catalogs = useLoad(() => Promise.all([ticketTypes(api), ticketStatuses(api)]).then(([types, statuses]) => ({ types, statuses })));
  const [typeId, setTypeId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [description, setDescription] = useState("");
  const [openOrder, setOpenOrder] = useState(true);
  const [orderStartDate, setOrderStartDate] = useState("");
  const [orderStartTime, setOrderStartTime] = useState("");
  const [orderEndDate, setOrderEndDate] = useState("");
  const [orderEndTime, setOrderEndTime] = useState("");
  const [showOrderEnd, setShowOrderEnd] = useState(false);
  const [notifyClient, setNotifyClient] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!client) return;

    if (openOrder) {
      if (orderStartTime.trim() && !orderStartDate.trim()) {
        notify.error("Informe a data de início da OS para o horário selecionado.");
        return;
      }
      if (showOrderEnd && orderStartDate.trim() && orderEndDate.trim() && orderEndDate.trim() < orderStartDate.trim()) {
        notify.error("A data de término não pode ser anterior à data de início.");
        return;
      }
      if (
        showOrderEnd &&
        orderStartDate.trim() &&
        orderEndDate.trim() &&
        orderStartDate.trim() === orderEndDate.trim() &&
        orderStartTime.trim() &&
        orderEndTime.trim() &&
        orderEndTime.trim() <= orderStartTime.trim()
      ) {
        notify.error("O horário de término deve ser posterior ao horário de início.");
        return;
      }
    }

    setSaving(true);
    try {
      const formatTime = (time?: string | null) => {
        if (!time?.trim()) return undefined;
        const trimmed = time.trim();
        return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
      };

      const hasSchedule = Boolean(openOrder && orderStartDate.trim());
      const startTimeFormatted = formatTime(orderStartTime) || "08:00:00";
      const endTimeFormatted = formatTime(orderEndTime) || (orderStartTime.trim() ? defaultEndTime(startTimeFormatted) : undefined);
      const endDateFormatted = (showOrderEnd && orderEndDate.trim()) || orderStartDate.trim() || undefined;

      const orderParams = hasSchedule
        ? {
            data_inicio_programado: orderStartDate.trim(),
            hora_inicio_programado: startTimeFormatted,
            data_termino_programado: endDateFormatted,
            hora_termino_programado: endTimeFormatted,
          }
        : undefined;

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
        abrir_os: openOrder,
        parametros_ordem_servico: orderParams,
        parametros: { origem: "FOCUS Chat", atendimento_focus_chat: attendance.atendimentoId, whatsapp: attendance.contato.numero },
      });
      const ticketId = result.atendimento?.id_atendimento;
      const protocol = result.atendimento?.protocolo ? String(result.atendimento.protocolo) : null;
      const existingOrders = result.atendimento?.ordens_servico ?? [];

      let orderOpened = existingOrders.length > 0;

      if (openOrder) {
        if (existingOrders.length > 0) {
          // A situação do chamado ou os parâmetros já criaram a OS no Hubsoft.
          // Se o atendente configurou data/horário, garantimos que o agendamento foi aplicado na OS:
          if (hasSchedule && existingOrders[0]?.id_ordem_servico) {
            try {
              await api.rescheduleServiceOrder({
                orderId: existingOrders[0].id_ordem_servico,
                startDate: orderStartDate.trim(),
                startTime: startTimeFormatted,
                endDate: endDateFormatted,
                endTime: endTimeFormatted,
              });
            } catch (scheduleErr) {
              console.warn("Não foi possível reagendar a OS criada automaticamente:", scheduleErr);
              notify.error(`Chamado e OS criados, mas houve falha ao agendar data/horário: ${errorMessage(scheduleErr)}`);
            }
          }
        } else if (ticketId) {
          // A situação do chamado não gerou OS automaticamente; abrimos explicitamente via abrir_os:
          try {
            await api.openServiceOrder(ticketId, {
              startDate: orderStartDate.trim() || undefined,
              startTime: orderStartTime.trim() || undefined,
              endDate: (showOrderEnd && orderEndDate.trim()) || undefined,
              endTime: (showOrderEnd && orderEndTime.trim()) || undefined,
            });
            orderOpened = true;
          } catch (osFailure) {
            console.warn("Falha ao abrir OS via abrir_os:", osFailure);
            notify.error(
              `Chamado aberto (protocolo ${protocol ?? "—"}), mas ocorreu uma falha ao abrir a OS: ${errorMessage(osFailure)}`,
            );
          }
        }
      }

      let scheduleText = "";
      if (orderStartDate.trim()) {
        const dateFormatted = formatBrDate(orderStartDate.trim());
        const timeFormatted = orderStartTime.trim() ? ` às ${orderStartTime.trim()}` : "";
        scheduleText = ` (agendada para ${dateFormatted}${timeFormatted})`;
      }

      const note = orderOpened
        ? protocol
          ? `Chamado ${protocol} e Ordem de Serviço abertos no Hubsoft pelo atendente${scheduleText}.`
          : `Chamado e Ordem de Serviço abertos no Hubsoft pelo atendente${scheduleText}.`
        : protocol
          ? `Chamado ${protocol} aberto no Hubsoft pelo atendente.`
          : "Chamado aberto no Hubsoft pelo atendente.";
      await addNote(attendance, note);

      if (notifyClient && protocol) {
        const clientMsg = orderOpened
          ? orderStartDate.trim()
            ? `Seu atendimento foi registrado e a Ordem de Serviço foi agendada para ${formatBrDate(orderStartDate.trim())}${orderStartTime.trim() ? ` às ${orderStartTime.trim()}` : ""}. Protocolo: ${protocol}. Guarde este número para acompanhar.`
            : `Seu atendimento foi registrado e a Ordem de Serviço foi aberta. Protocolo: ${protocol}. Guarde este número para acompanhar.`
          : `Seu atendimento foi registrado. Protocolo: ${protocol}. Guarde este número para acompanhar.`;
        await sendToContact(attendance, clientMsg);
      }

      if (orderOpened) {
        notify.success(protocol ? `Chamado e OS abertos. Protocolo ${protocol}` : "Chamado e OS abertos no Hubsoft");
      } else {
        notify.success(protocol ? `Chamado aberto. Protocolo ${protocol}` : "Chamado aberto no Hubsoft");
      }
      onCreated();
    } catch (failure) {
      notify.error(failure);
      setSaving(false);
    }
  };

  return (
    <Box sx={content}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: "center",
          mb: 2,
          pb: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Button
          startIcon={<ArrowBack sx={{ fontSize: "1.1rem !important" }} />}
          onClick={onBack}
          disabled={saving}
          size="small"
          sx={{
            color: "text.secondary",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: "action.hover",
            "&:hover": {
              color: "primary.main",
              bgcolor: "action.selected",
            },
          }}
        >
          Voltar
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main", fontSize: "1.05rem" }}>
          Novo chamado
        </Typography>
      </Stack>

      <Box
        sx={{
          bgcolor: "background.paper",
          p: 1.5,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.25 }}>
          Serviço
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
          {service.planNumber !== null ? `(${service.planNumber}) ` : ""}{service.name}
        </Typography>
      </Box>

      <Stack spacing={2.5}>
        <TextField
          label="O que o cliente relatou"
          multiline
          minRows={3}
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
            <TextField
              select
              label="Tipo de atendimento"
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
              fullWidth
              helperText="Sem escolher, o Hubsoft usa o tipo padrão (SAC)"
              slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
            >
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
              helperText="Opcional. Sem escolher, o Hubsoft usa a situação padrão"
              slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
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

        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5, bgcolor: "background.paper" }}>
          <FormControlLabel
            control={<Checkbox checked={openOrder} onChange={(event) => setOpenOrder(event.target.checked)} />}
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Abrir Ordem de Serviço (OS) vinculada ao chamado
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gera a OS automaticamente no Hubsoft para a equipe técnica
                </Typography>
              </Box>
            }
            sx={{ m: 0, alignItems: "flex-start" }}
          />

          {openOrder && (
            <Box
              sx={{
                mt: 1.5,
                pt: 1.5,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Início programado da OS
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <Button
                    size="small"
                    variant={orderStartDate === isoDate(new Date()) ? "contained" : "outlined"}
                    onClick={() => {
                      const today = isoDate(new Date());
                      setOrderStartDate(today);
                      if (showOrderEnd && !orderEndDate) setOrderEndDate(today);
                    }}
                    sx={{ fontSize: "0.75rem", py: 0.25, px: 1, minWidth: "auto", textTransform: "none" }}
                  >
                    Hoje
                  </Button>
                  <Button
                    size="small"
                    variant={
                      orderStartDate ===
                      (() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        return isoDate(d);
                      })()
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      const tomorrow = isoDate(d);
                      setOrderStartDate(tomorrow);
                      if (showOrderEnd && !orderEndDate) setOrderEndDate(tomorrow);
                    }}
                    sx={{ fontSize: "0.75rem", py: 0.25, px: 1, minWidth: "auto", textTransform: "none" }}
                  >
                    Amanhã
                  </Button>
                  {(orderStartDate || orderStartTime || orderEndDate || orderEndTime) && (
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => {
                        setOrderStartDate("");
                        setOrderStartTime("");
                        setOrderEndDate("");
                        setOrderEndTime("");
                        setShowOrderEnd(false);
                      }}
                      sx={{ fontSize: "0.75rem", py: 0.25, px: 1, minWidth: "auto", textTransform: "none", color: "text.secondary" }}
                    >
                      Limpar
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  type="date"
                  label="Data de início"
                  value={orderStartDate}
                  onChange={(event) => {
                    const newDate = event.target.value;
                    setOrderStartDate(newDate);
                    if (showOrderEnd && !orderEndDate) setOrderEndDate(newDate);
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  size="small"
                  fullWidth
                  helperText="Opcional. Sem data, fica aguardando agendamento"
                />
                <TextField
                  type="time"
                  label="Horário de início"
                  value={orderStartTime}
                  onChange={(event) => {
                    const newTime = event.target.value;
                    setOrderStartTime(newTime);
                    if (newTime && !orderStartDate) {
                      setOrderStartDate(isoDate(new Date()));
                    }
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  size="small"
                  fullWidth
                  helperText="Opcional. Ex: 08:00, 14:00"
                />
              </Stack>

              {!showOrderEnd ? (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setShowOrderEnd(true);
                    if (orderStartDate && !orderEndDate) setOrderEndDate(orderStartDate);
                  }}
                  sx={{ mt: 1, textTransform: "none", fontSize: "0.75rem", p: 0, color: "text.secondary", fontWeight: 600 }}
                >
                  + Definir término previsto (opcional)
                </Button>
              ) : (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Término previsto da OS (opcional)
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => {
                        setShowOrderEnd(false);
                        setOrderEndDate("");
                        setOrderEndTime("");
                      }}
                      sx={{ fontSize: "0.75rem", p: 0, textTransform: "none", color: "text.secondary" }}
                    >
                      Remover término
                    </Button>
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <TextField
                      type="date"
                      label="Data de término"
                      value={orderEndDate}
                      onChange={(event) => setOrderEndDate(event.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      type="time"
                      label="Horário de término"
                      value={orderEndTime}
                      onChange={(event) => setOrderEndTime(event.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      size="small"
                      fullWidth
                      helperText="Ex: 11:30, 17:00"
                    />
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </Box>

        <FormControlLabel
          control={<Checkbox checked={notifyClient} onChange={(event) => setNotifyClient(event.target.checked)} />}
          label="Enviar o número do protocolo pro cliente na conversa"
        />

        <Stack direction="row" spacing={1.5} sx={{ pt: 2, pb: 1, borderTop: 1, borderColor: "divider" }}>
          <Button variant="outlined" onClick={onBack} disabled={saving} sx={{ flex: 1, py: 1.2 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void submit()}
            disabled={saving || !description.trim()}
            sx={{ flex: 1.5, py: 1.2, fontWeight: 700 }}
          >
            {saving ? "Abrindo…" : "Abrir chamado"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function CloseTicketView({
  api,
  ticket,
  onBack,
  onClosed,
}: {
  api: HubsoftApi;
  ticket: Ticket;
  onBack: () => void;
  onClosed: () => void;
}) {
  const { attendance } = useAttendance();
  const notify = useNotify();
  const reasons = useLoad(() => closeReasons(api));
  const [reasonId, setReasonId] = useState("");
  const [description, setDescription] = useState("Atendimento concluído pelo FOCUS Chat.");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.closeTicket(ticket.id, {
        id_motivo_fechamento_atendimento: reasonId ? Number(reasonId) : undefined,
        descricao_fechamento: description.trim(),
      });
      await addNote(attendance, `Chamado ${ticket.protocol} fechado no Hubsoft pelo atendente.`);
      notify.success(`Chamado ${ticket.protocol} fechado`);
      onClosed();
    } catch (failure) {
      notify.error(failure);
      setSaving(false);
    }
  };

  return (
    <Box sx={content}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: "center",
          mb: 2,
          pb: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Button
          startIcon={<ArrowBack sx={{ fontSize: "1.1rem !important" }} />}
          onClick={onBack}
          disabled={saving}
          size="small"
          sx={{
            color: "text.secondary",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: "action.hover",
            "&:hover": {
              color: "primary.main",
              bgcolor: "action.selected",
            },
          }}
        >
          Voltar
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main", fontSize: "1.05rem" }}>
          Fechar chamado
        </Typography>
      </Stack>

      <Box
        sx={{
          bgcolor: "background.paper",
          p: 1.5,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.25 }}>
          Protocolo
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
          {ticket.protocol}
        </Typography>
        {ticket.serviceName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {ticket.serviceName}
          </Typography>
        )}
      </Box>

      <Stack spacing={2.5}>
        <LoadState loading={reasons.loading} error={reasons.error} onRetry={() => void reasons.reload()} />
        {reasons.data && (
          <TextField
            select
            label="Motivo do fechamento"
            value={reasonId}
            onChange={(event) => setReasonId(event.target.value)}
            fullWidth
            helperText="Sem escolher, o Hubsoft usa o motivo padrão"
            slotProps={{ select: { MenuProps: SELECT_MENU_PROPS } }}
          >
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

        <Stack direction="row" spacing={1.5} sx={{ pt: 2, pb: 1, borderTop: 1, borderColor: "divider" }}>
          <Button variant="outlined" onClick={onBack} disabled={saving} sx={{ flex: 1, py: 1.2 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => void submit()}
            disabled={saving || !description.trim()}
            sx={{ flex: 1.5, py: 1.2, fontWeight: 700 }}
          >
            {saving ? "Fechando…" : "Fechar chamado"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
