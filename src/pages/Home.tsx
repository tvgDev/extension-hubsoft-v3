import Refresh from "@mui/icons-material/Refresh";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAttendance } from "../attendance";
import { LoadState } from "../components/common";
import { PageShell } from "../components/PageShell";
import { isPaid } from "../status";
import { ClientTab } from "./ClientTab";
import { FinanceTab } from "./FinanceTab";

export type HomeTab = "cliente" | "financeiro";

/** Painel do atendimento: cada aba é uma rota própria. */
export function Home({ tab }: { tab: HomeTab }) {
  const { data, error, loading, reload } = useAttendance();
  const [refreshing, setRefreshing] = useState(false);
  const openInvoices = data?.invoices.filter((invoice) => !isPaid(invoice.status)).length ?? 0;
  const ready = data !== null && !loading && !error;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
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
    >
      <Tabs value={tab} sx={{ borderBottom: 1, borderColor: "divider", minHeight: 49 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Cliente" value="cliente" component={Link} to="/cliente" replace />
        <Tab
          label={
            <Badge badgeContent={openInvoices} color="primary" sx={{ pr: openInvoices > 0 ? 1.5 : 0 }}>
              Financeiro
            </Badge>
          }
          value="financeiro"
          component={Link}
          to="/financeiro"
          replace
        />
      </Tabs>
      {refreshing && <LinearProgress />}
      <Box sx={{ flexGrow: 1 }}>
        {!ready && (
          <Box sx={{ p: 3 }}>
            <LoadState loading={loading} error={error} onRetry={() => void refresh()} label="Sincronizando com o Hubsoft…" />
          </Box>
        )}
        {ready && tab === "cliente" && <ClientTab />}
        {ready && tab === "financeiro" && <FinanceTab />}
      </Box>
    </PageShell>
  );
}
