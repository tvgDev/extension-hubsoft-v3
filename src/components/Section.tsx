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
  /** Só monta o conteúdo quando a seção é aberta pela primeira vez (evita chamadas à API à toa). */
  lazy?: boolean;
  /** Controle externo de aberto/fechado (ex.: abrir a seção depois de uma ação). */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  children: ReactNode;
}

/** Seção recolhível no mesmo formato das telas do FOCUS Chat: título, seta e linha. */
export function Section({ title, aside, defaultOpen = true, lazy = false, open: controlled, onToggle, children }: Props) {
  const [internal, setInternal] = useState(defaultOpen);
  const open = controlled ?? internal;
  const [opened, setOpened] = useState(open);

  const toggle = () => {
    const next = !open;
    onToggle?.(next);
    if (controlled === undefined) setInternal(next);
    setOpened(true);
  };

  return (
    <Box component="section">
      <Box
        onClick={toggle}
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
        {aside && <Box onClick={(event) => event.stopPropagation()}>{aside}</Box>}
        <IconButton size="small" aria-label={open ? `Recolher ${title}` : `Expandir ${title}`} sx={{ color: "primary.main", mr: -0.5 }}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ pt: 3, pb: 1 }}>{(!lazy || opened || open) && children}</Box>
      </Collapse>
    </Box>
  );
}
