// src/services/wlextension.ts

export const wlExtensionAlert = (message: string, variant: 'success' | 'warning' | 'error' | 'info' = 'info') => {
  // Use console only as requested by the user
  const logMsg = `[WlExtension Alert - ${variant}]: ${message}`;
  if (variant === 'error') {
    console.error(logMsg);
  } else if (variant === 'warning') {
    console.warn(logMsg);
  } else {
    console.log(logMsg);
  }
};

export const wlExtensionConfirm = (title: string, text: string, callback: (confirm: boolean) => void) => {
  if (window.WlExtension && window.WlExtension.confirmDialog) {
    window.WlExtension.confirmDialog({ title, text, callback });
  } else {
    // Fallback for local development
    const result = window.confirm(`${title}\n\n${text}`);
    callback(result);
  }
};

export const wlExtensionOpenWidget = () => {
    if (window.WlExtension && window.WlExtension.openWidget) {
        window.WlExtension.openWidget();
    } else {
        console.log(`[WlExtension] Widget Oponed`);
    }
}
