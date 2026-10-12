import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

/** Cartão com borda azul-marinho, como os blocos de "Provedores LLM" do FOCUS Chat. */
export function OutlinedCard({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ border: 1, borderColor: "primary.main", borderRadius: 2, p: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
        <Typography sx={{ fontWeight: 700, color: "primary.main", flexGrow: 1 }}>{title}</Typography>
        {aside}
      </Stack>
      {children}
    </Box>
  );
}
