import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  /** Texto de apoio à direita do título (ex.: situação do serviço). */
  aside?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Seção recolhível no mesmo formato das telas do FOCUS Chat: título, seta e linha. */
export function Section({ title, aside, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box component="section">
      <Box
        onClick={() => setOpen((value) => !value)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          pt: 3,
          pb: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Typography component="h2" sx={{ fontSize: "1.0625rem", flexGrow: 1 }}>
          {title}
        </Typography>
        {aside}
        <IconButton size="small" aria-label={open ? `Recolher ${title}` : `Expandir ${title}`} sx={{ color: "primary.main", mr: -0.5 }}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ pt: 3, pb: 1 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}
