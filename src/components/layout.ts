// Grades e recuos usados nas abas: mais apertados no widget lateral, como o painel no desktop.
export const twoColumns = { display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } } as const;
export const fullRow = { gridColumn: "1 / -1" } as const;

/** Recuo do conteúdo de cada aba. */
export const content = { px: { xs: 2, md: 3 }, pb: 4 } as const;
export const contentTop = { pt: { xs: 2, md: 3 } } as const;
