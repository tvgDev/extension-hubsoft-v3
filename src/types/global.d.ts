// src/types/global.d.ts
export {};

declare global {
  interface Window {
    WlExtension: {
      initialize: (config: { events: Record<string, (data?: any) => void> }) => void;
      alert: (config: { message: string; variant?: 'success' | 'warning' | 'error' | 'info' }) => void;
      confirmDialog: (config: { title: string; text: string; callback: (confirm: boolean) => void }) => void;
      openWidget: () => void;
    };
  }
}
