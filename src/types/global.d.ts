import type { WlAttendance } from "../model";

declare global {
  /** Biblioteca `wlclient` carregada no index.html, que conversa com o painel do FOCUS Chat. */
  interface WlExtensionApi {
    initialize(config: {
      events: {
        onOpenAttendance?: (attendance: WlAttendance) => void;
        onCloseAttendance?: () => void;
      };
    }): void;
    alert(config: { message: string; variant?: "success" | "warning" | "error" | "info" }): void;
    confirmDialog(config: { title: string; text: string; callback: (confirm: boolean) => void }): void;
    openWidget(): void;
  }

  interface Window {
    /** Só existe quando o módulo roda dentro do painel do FOCUS Chat. */
    WlExtension?: WlExtensionApi;
  }
}

export {};
