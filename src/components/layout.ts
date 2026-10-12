// Grades usadas nos formulários: dois campos lado a lado, um por linha quando o painel é estreito.
export const twoColumns = { display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } } as const;
export const fullRow = { gridColumn: "1 / -1" } as const;
