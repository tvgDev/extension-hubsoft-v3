import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/** Verdadeiro no widget lateral do FOCUS Chat (menos de 900px); falso no painel aberto no desktop. */
export function useNarrow(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("md"));
}
