import ContentCopy from "@mui/icons-material/ContentCopy";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { useNotify } from "./useFeedback";

type Columns = { xs?: string; sm?: string; md?: string } | string;

/** Grade compacta de pares etiqueta/valor (duas colunas no widget, três no desktop). */
export function InfoGrid({ children, columns = { xs: "1fr 1fr", md: "repeat(3, 1fr)" } }: { children: ReactNode; columns?: Columns }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: columns, columnGap: 2, rowGap: 2 }}>{children}</Box>;
}

interface Props {
  label: string;
  value: string | number | null | undefined;
  /** Ocupa a linha inteira da grade (valores longos: nome, endereço, e-mail). */
  full?: boolean;
  /** Mostra escondido, com botão para revelar (senhas). */
  secret?: boolean;
  /** Botão para copiar o valor. */
  copy?: boolean;
}

/** Etiqueta pequena em cinza e valor embaixo, como os campos do painel, sem a caixa. */
export function InfoItem({ label, value, full, secret, copy }: Props) {
  const [visible, setVisible] = useState(false);
  const notify = useNotify();
  const text = value === null || value === undefined || value === "" ? "—" : String(value);
  const hasValue = text !== "—";
  const hidden = secret && !visible && hasValue;

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success(`${label} copiado`);
    } catch {
      notify.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  return (
    <Box sx={{ minWidth: 0, gridColumn: full ? "1 / -1" : undefined }}>
      <Typography variant="caption" sx={{ display: "block", color: "text.disabled", lineHeight: 1.3 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", minHeight: 28 }}>
        <Typography sx={{ fontWeight: 500, overflowWrap: "anywhere", color: hasValue ? "text.primary" : "text.secondary", letterSpacing: hidden ? "0.15em" : undefined }}>
          {hidden ? "••••••" : text}
        </Typography>
        {hasValue && secret && (
          <Tooltip title={visible ? "Esconder" : "Mostrar"}>
            <IconButton size="small" onClick={() => setVisible((current) => !current)} aria-label={visible ? `Esconder ${label}` : `Mostrar ${label}`}>
              {visible ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        )}
        {hasValue && copy && (
          <Tooltip title="Copiar">
            <IconButton size="small" onClick={() => void copyValue()} aria-label={`Copiar ${label}`}>
              <ContentCopy sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}
