import { createContext, useContext } from "react";

export interface Notifier {
  success(message: string): void;
  error(error: unknown): void;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export type Confirm = (options: ConfirmOptions) => Promise<boolean>;

export const NotifyContext = createContext<Notifier | null>(null);
export const ConfirmContext = createContext<Confirm | null>(null);

/** Toast embaixo ao centro: `success` (3,5s) ou `error` (8s), via FeedbackProvider. */
export function useNotify(): Notifier {
  const context = useContext(NotifyContext);
  if (!context) throw new Error("useNotify fora do FeedbackProvider");
  return context;
}

/** Diálogo de confirmação que devolve true/false, via FeedbackProvider. */
export function useConfirm(): Confirm {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm fora do FeedbackProvider");
  return context;
}
