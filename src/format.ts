const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 99.9 → "R$ 99,90". */
export const formatMoney = (value: number) => money.format(value);
