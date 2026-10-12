import ContentCopy from "@mui/icons-material/ContentCopy";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { fullRow } from "./layout";
import { useNotify } from "./useFeedback";

interface Props {
  label: string;
  value: string | number | null | undefined;
  /** Ocupa a linha inteira da grade. */
  full?: boolean;
  multiline?: boolean;
  /** Mostra escondido, com botão para revelar (senhas). */
  secret?: boolean;
  /** Botão para copiar o valor. */
  copy?: boolean;
}

/** Campo só de leitura no formato dos formulários do painel, com revelar/copiar quando faz sentido. */
export function ReadOnlyField({ label, value, full, multiline, secret, copy }: Props) {
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

  const adornment =
    hasValue && (secret || copy) ? (
      <InputAdornment position="end">
        {secret && (
          <Tooltip title={visible ? "Esconder" : "Mostrar"}>
            <IconButton size="small" onClick={() => setVisible((current) => !current)} aria-label={visible ? `Esconder ${label}` : `Mostrar ${label}`}>
              {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
        {copy && (
          <Tooltip title="Copiar">
            <IconButton size="small" onClick={() => void copyValue()} aria-label={`Copiar ${label}`}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </InputAdornment>
    ) : undefined;

  return (
    <TextField
      label={label}
      value={hidden ? "••••••••" : text}
      multiline={multiline && !hidden}
      fullWidth
      slotProps={{ input: { readOnly: true, endAdornment: adornment }, inputLabel: { shrink: true } }}
      sx={full ? fullRow : undefined}
    />
  );
}
