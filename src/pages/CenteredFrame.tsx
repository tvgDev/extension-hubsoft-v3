import Hub from "@mui/icons-material/Hub";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { headerGradient } from "../theme";

/** Telas fora do painel (entrada, aviso): fundo com o degradê e um cartão branco centralizado. */
export function CenteredFrame({ title, subtitle, icon, children }: { title: string; subtitle: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", background: headerGradient, p: 2 }}>
      <Paper sx={{ width: "100%", maxWidth: 420, p: 4, borderRadius: 2 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: "primary.main", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
              {icon ?? <Hub />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2, color: "primary.main" }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Stack>
          {children}
        </Stack>
      </Paper>
    </Box>
  );
}
