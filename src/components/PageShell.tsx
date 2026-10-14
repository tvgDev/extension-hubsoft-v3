import ArrowBack from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { headerGradient } from "../theme";

interface Props {
  title: string;
  /** Botão "← Voltar" no canto esquerdo da faixa. */
  back?: { label?: string; to?: string; onClick?: () => void };
  /** Canto direito da faixa (menu da conta, ajuda…); ícones em branco. */
  actions?: ReactNode;
  /** Faixa acima do cabeçalho (avisos de conta, período de teste…). */
  banner?: ReactNode;
  /** Barra de abas fixada no topo, logo abaixo do cabeçalho. */
  tabs?: ReactNode;
  /** Elementos adicionais fixados abaixo das abas (ex.: seletor de serviço). */
  subHeader?: ReactNode;
  children: ReactNode;
}

/**
 * Casca do painel: cabeçalho e abas fixados no topo para nunca sumirem na rolagem,
 * e área de conteúdo com rolagem independente.
 */
export function PageShell({ title, back, actions, banner, tabs, subHeader, children }: Props) {
  return (
    <Box
      sx={{
        height: { xs: "calc(100vh - 50px)", md: "100vh" },
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      {banner}

      {/* Faixa azul-marinho compacta e fixa */}
      <Box
        sx={{
          background: headerGradient,
          color: "#fff",
          flexShrink: 0,
          height: { xs: 40, md: 54 },
          px: { xs: 1.5, md: 3 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1100,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, gap: 1 }}>
          {back && (
            <Button
              {...(back.to ? { component: Link, to: back.to } : { onClick: back.onClick })}
              startIcon={<ArrowBack />}
              size="small"
              sx={{
                color: "#fff",
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.8125rem", md: "0.875rem" },
                minWidth: 0,
                px: { xs: 0.75, md: 1 },
                py: 0.25,
                mr: 0.5,
                borderRadius: 1,
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)" },
              }}
            >
              {back.label ?? "Voltar"}
            </Button>
          )}
          <Typography
            component="h1"
            noWrap
            sx={{
              fontSize: { xs: "0.9375rem", md: "1.125rem" },
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {actions}
        </Box>
      </Box>

      {/* Abas e controles fixados no topo — nunca somem ao rolar a página */}
      {tabs && (
        <Box
          sx={{
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
            zIndex: 1050,
          }}
        >
          {tabs}
          {subHeader}
        </Box>
      )}

      {/* Área de conteúdo rolável de forma independente */}
      <Box
        id="attendance-scroll-container"
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          bgcolor: "background.paper",
          WebkitOverflowScrolling: "touch",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ flex: 1 }}>
          {children}
        </Box>

        {/* Rodapé de segurança: garante margem limpa no fim da rolagem para nada ser cortado */}
        <Box
          sx={{
            py: 2.5,
            textAlign: "center",
            color: "text.disabled",
            fontSize: "0.75rem",
            userSelect: "none",
            flexShrink: 0,
          }}
        >
          Hubsoft · FOCUS Chat
        </Box>
      </Box>
    </Box>
  );
}
