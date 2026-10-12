import Refresh from "@mui/icons-material/Refresh";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAttendance } from "../attendance";
import { LoadState } from "../components/common";
import { PageShell } from "../components/PageShell";
import { ClientTab } from "./ClientTab";
import { ConnectionTab } from "./ConnectionTab";
import { CoverageTab } from "./CoverageTab";
import { FinanceTab } from "./FinanceTab";
import { TicketsTab } from "./TicketsTab";

export type HomeTab = "cliente" | "conexao" | "financeiro" | "chamados" | "cobertura";

/** Painel do atendimento: cada aba é uma rota própria. */
export function Home({ tab }: { tab: HomeTab }) {
  const { data, error, loading, reload, service, selectService } = useAttendance();
  const [refreshing, setRefreshing] = useState(false);
  const ready = data !== null && !loading && !error;
  const services = data?.client?.services ?? [];
  const openInvoices = data?.invoices.filter((invoice) => !invoice.paid).length ?? 0;
  const connection = service?.connection ?? null;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  const tabs: Array<{ key: HomeTab; label: ReactNode }> = [
    { key: "cliente", label: "Cliente" },
    {
      key: "conexao",
      label: (
        <Badge variant="dot" color={connection?.online ? "success" : "error"} invisible={!connection} sx={{ "& .MuiBadge-badge": { right: -8, top: 4 } }}>
          Conexão
        </Badge>
      ),
    },
    {
      key: "financeiro",
      label: (
        <Badge badgeContent={openInvoices} color="primary" sx={{ pr: openInvoices > 0 ? 1.5 : 0 }}>
          Financeiro
        </Badge>
      ),
    },
    {
      key: "chamados",
      label: (
        <Badge badgeContent={data?.openTickets ?? 0} color="primary" sx={{ pr: (data?.openTickets ?? 0) > 0 ? 1.5 : 0 }}>
          Chamados
        </Badge>
      ),
    },
    { key: "cobertura", label: "Cobertura" },
  ];

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
    >
      <Tabs value={tab} sx={{ borderBottom: 1, borderColor: "divider", minHeight: 49 }} variant="scrollable" scrollButtons allowScrollButtonsMobile>
        {tabs.map((entry) => (
          <Tab key={entry.key} value={entry.key} label={entry.label} component={Link} to={`/${entry.key}`} replace sx={{ minWidth: { xs: 104, md: 160 } }} />
        ))}
      </Tabs>
      {refreshing && <LinearProgress />}

      {ready && services.length > 1 && service && (
        <Box sx={{ px: 3, pt: 3 }}>
          <TextField
            select
            size="small"
            fullWidth
            label="Serviço em uso"
            value={service.id}
            onChange={(event) => selectService(Number(event.target.value))}
            helperText="As abas Conexão e Chamados usam este serviço"
          >
            {services.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.planNumber !== null ? `(${item.planNumber}) ` : ""}
                {item.name} · {item.status}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      )}

      <Box sx={{ flexGrow: 1 }}>
        {!ready && (
          <Box sx={{ p: 3 }}>
            <LoadState loading={loading} error={error} onRetry={() => void refresh()} label="Sincronizando com o Hubsoft…" />
          </Box>
        )}
        {ready && tab === "cliente" && <ClientTab />}
        {ready && tab === "conexao" && <ConnectionTab />}
        {ready && tab === "financeiro" && <FinanceTab />}
        {ready && tab === "chamados" && <TicketsTab />}
        {ready && tab === "cobertura" && <CoverageTab />}
      </Box>
    </PageShell>
  );
}
