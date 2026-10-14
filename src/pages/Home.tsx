import Person from "@mui/icons-material/Person";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Refresh from "@mui/icons-material/Refresh";
import SupportAgent from "@mui/icons-material/SupportAgent";
import TravelExplore from "@mui/icons-material/TravelExplore";
import Wifi from "@mui/icons-material/Wifi";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAttendance } from "../attendance";
import { LoadState } from "../components/common";
import { PageShell } from "../components/PageShell";
import { useNarrow } from "../components/useNarrow";
import { ClientTab } from "./ClientTab";
import { ConnectionTab } from "./ConnectionTab";
import { CoverageTab } from "./CoverageTab";
import { FinanceTab } from "./FinanceTab";
import { TicketsTab } from "./TicketsTab";

export type HomeTab = "cliente" | "conexao" | "financeiro" | "chamados" | "cobertura";

const TABS: Array<{ key: HomeTab; label: string; shortLabel: string; icon: ReactElement }> = [
  { key: "cliente", label: "Cliente", shortLabel: "Cliente", icon: <Person /> },
  { key: "conexao", label: "Conexão", shortLabel: "Conexão", icon: <Wifi /> },
  { key: "financeiro", label: "Financeiro", shortLabel: "Faturas", icon: <ReceiptLong /> },
  { key: "chamados", label: "Chamados", shortLabel: "Chamados", icon: <SupportAgent /> },
  { key: "cobertura", label: "Cobertura", shortLabel: "Cobertura", icon: <TravelExplore /> },
];

/** Abas que dependem do serviço escolhido (quando o cliente tem mais de um). */
const SERVICE_TABS: HomeTab[] = ["cliente", "conexao", "chamados"];

/** Painel do atendimento: cada aba é uma rota própria. */
export function Home({ tab }: { tab: HomeTab }) {
  const { data, error, loading, reload, service, selectService } = useAttendance();
  const narrow = useNarrow();
  const [refreshing, setRefreshing] = useState(false);
  const ready = data !== null && !loading && !error;
  const services = data?.client?.services ?? [];
  const openInvoices = data?.invoices.filter((invoice) => !invoice.paid).length ?? 0;
  const openTickets = data?.openTickets ?? 0;
  const connection = service?.connection ?? null;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  // No widget o contador fica sobre o ícone; no desktop, ao lado do texto.
  const badged = (key: HomeTab, node: ReactElement | string): ReactElement | string => {
    const padded = narrow ? undefined : { pr: 1.5 };
    if (key === "conexao") {
      return (
        <Badge variant="dot" color={connection?.online ? "success" : "error"} invisible={!connection} sx={narrow ? undefined : { "& .MuiBadge-badge": { right: -8, top: 4 } }}>
          {node}
        </Badge>
      );
    }
    if (key === "financeiro") {
      return (
        <Badge badgeContent={openInvoices} color="primary" sx={openInvoices > 0 ? padded : undefined}>
          {node}
        </Badge>
      );
    }
    if (key === "chamados") {
      return (
        <Badge badgeContent={openTickets} color="primary" sx={openTickets > 0 ? padded : undefined}>
          {node}
        </Badge>
      );
    }
    return node;
  };

  return (
    <PageShell
      title="Hubsoft"
      actions={
        <Tooltip title="Buscar de novo no Hubsoft">
          <span>
            <IconButton sx={{ color: "#fff" }} aria-label="Atualizar dados" onClick={() => void refresh()} disabled={loading || refreshing}>
              <Refresh />
            </IconButton>
          </span>
        </Tooltip>
      }
      tabs={
        <>
          {narrow ? (
            <Tabs value={tab} variant="fullWidth" sx={{ borderBottom: 1, borderColor: "divider", minHeight: 56 }}>
              {TABS.map((entry) => (
                <Tab
                  key={entry.key}
                  value={entry.key}
                  icon={badged(entry.key, entry.icon)}
                  label={entry.shortLabel}
                  component={Link}
                  to={`/${entry.key}`}
                  replace
                  sx={{ minHeight: 56, minWidth: 0, px: 0.5, fontSize: "0.75rem", "& .MuiTab-icon": { mb: 0.25 } }}
                />
              ))}
            </Tabs>
          ) : (
            <Tabs value={tab} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider", minHeight: 48 }}>
              {TABS.map((entry) => (
                <Tab key={entry.key} value={entry.key} label={badged(entry.key, entry.label)} component={Link} to={`/${entry.key}`} replace />
              ))}
            </Tabs>
          )}
          {refreshing && <LinearProgress />}
        </>
      }
      subHeader={
        ready && services.length > 1 && service && SERVICE_TABS.includes(tab) ? (
          <Box sx={{ px: { xs: 2, md: 3 }, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
            <TextField
              select
              size="small"
              fullWidth
              label="Serviço em uso"
              value={service.id}
              onChange={(event) => selectService(Number(event.target.value))}
              helperText="Vale para as abas Conexão e Chamados"
            >
              {services.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.planNumber !== null ? `(${item.planNumber}) ` : ""}
                  {item.name} · {item.status}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        ) : undefined
      }
    >
      {!ready && (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <LoadState loading={loading} error={error} onRetry={() => void refresh()} label="Sincronizando com o Hubsoft…" />
        </Box>
      )}
      {ready && tab === "cliente" && <ClientTab />}
      {ready && tab === "conexao" && <ConnectionTab />}
      {ready && tab === "financeiro" && <FinanceTab />}
      {ready && tab === "chamados" && <TicketsTab />}
      {ready && tab === "cobertura" && <CoverageTab />}
    </PageShell>
  );
}
