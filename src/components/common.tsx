import Person from "@mui/icons-material/Person";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { headerGradient } from "../theme";

/** Cabeçalho das listagens: explicação curta à esquerda, ação principal à direita. */
export function TabIntro({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, mb: 3 }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography color="text.secondary" sx={{ maxWidth: 820 }}>
          {children}
        </Typography>
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Stack>
  );
}

/** Carregando / erro com "Tentar de novo"; nada quando os dados chegaram. */
export function LoadState({ loading, error, onRetry, label }: { loading: boolean; error: string | null; onRetry?: () => void; label?: string }) {
  if (error) {
    return (
      <Alert severity="error">
        {error}
        {onRetry && (
          <Box sx={{ mt: 1.5 }}>
            <Button color="inherit" size="small" variant="outlined" onClick={onRetry}>
              Tentar de novo
            </Button>
          </Box>
        )}
      </Alert>
    );
  }
  if (loading) {
    return (
      <Stack spacing={2} sx={{ alignItems: "center", py: 8 }}>
        <CircularProgress />
        {label && <Typography color="text.secondary">{label}</Typography>}
      </Stack>
    );
  }
  return null;
}

/** Lista vazia: caixa tracejada com título e uma frase do que fazer. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Box sx={{ textAlign: "center", py: 7, px: 2, border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
      {children && <Typography color="text.secondary">{children}</Typography>}
    </Box>
  );
}

/** Avatar redondo com o degradê do cabeçalho e borda branca (64px nos cartões). */
export function RoundAvatar({ src, size, icon }: { src: string | null; size: number; icon?: ReactNode }) {
  return (
    <Avatar
      src={src ?? undefined}
      alt=""
      sx={{
        width: size,
        height: size,
        background: headerGradient,
        border: "3px solid #fff",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.25)",
      }}
    >
      {icon ?? <Person sx={{ fontSize: size * 0.5 }} />}
    </Avatar>
  );
}
