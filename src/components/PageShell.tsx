import ArrowBack from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { headerGradient } from "../theme";

// Medidas da tela de agentes do FOCUS Chat: faixa escura de 149px e cartão
// branco começando aos 99px, de modo que as abas fiquem sobre a faixa.
const HEADER_HEIGHT = 149;
const CARD_TOP = 99;

interface Props {
  title: string;
  /** Botão "← Voltar" no canto esquerdo da faixa. */
  back?: { label: string; to: string };
  /** Canto direito da faixa (menu da conta, ajuda…); ícones em branco. */
  actions?: ReactNode;
  /** Faixa acima do cabeçalho (avisos de conta, período de teste…). */
  banner?: ReactNode;
  children: ReactNode;
}

/** Casca de toda página: faixa azul-marinho com título centralizado e cartão branco com as abas. */
export function PageShell({ title, back, actions, banner, children }: Props) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {banner}
      <Box sx={{ height: HEADER_HEIGHT, background: headerGradient, color: "#fff" }}>
        <Box
          sx={{
            height: CARD_TOP,
            px: { xs: 2, md: 4 },
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            {back && (
              <Button
                component={Link}
                to={back.to}
                startIcon={<ArrowBack />}
                sx={{ color: "#fff", textTransform: "none", fontWeight: 500, fontSize: "1rem", ml: -1 }}
              >
                {back.label}
              </Button>
            )}
          </Box>
          <Typography component="h1" noWrap sx={{ fontSize: "1.25rem", fontWeight: 700, textAlign: "center", maxWidth: "60vw" }}>
            {title}
          </Typography>
          <Box sx={{ justifySelf: "end" }}>{actions}</Box>
        </Box>
      </Box>
      <Paper
        elevation={0}
        sx={{
          mx: { xs: 1.5, md: 4 },
          mt: `${CARD_TOP - HEADER_HEIGHT}px`,
          minHeight: `calc(100vh - ${CARD_TOP}px)`,
          borderRadius: "8px 8px 0 0",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}
