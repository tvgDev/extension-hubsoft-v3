import Box from "@mui/material/Box";
import CardActionArea from "@mui/material/CardActionArea";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { StatusColor } from "../status";

interface Props {
  icon: ReactNode;
  title: string;
  caption?: string;
  color: StatusColor;
  /** Aba que abre ao tocar. */
  to: string;
}

/** Bloco de resumo que diz a situação em uma olhada e leva para a aba certa. */
export function StatusTile({ icon, title, caption, color, to }: Props) {
  const tone = color === "default" ? "text.disabled" : `${color}.main`;
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", borderLeft: 4, borderLeftColor: tone }}>
      <CardActionArea component={Link} to={to} sx={{ p: 1.5, height: "100%" }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Box sx={{ color: tone, display: "flex", flexShrink: 0 }}>{icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}>
              {title}
            </Typography>
            {caption && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2, mt: 0.25, wordBreak: "break-word" }}>
                {caption}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardActionArea>
    </Paper>
  );
}
