import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { errorMessage } from "../services/http";
import { ConfirmContext, NotifyContext, type Confirm, type ConfirmOptions, type Notifier } from "./useFeedback";

/** Toast (Snackbar) e diálogo de confirmação no padrão do painel; use com useNotify/useConfirm. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ severity: "success" | "error"; message: string; key: number } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const notifier = useMemo<Notifier>(
    () => ({
      success: (message) => setToast({ severity: "success", message, key: Date.now() }),
      error: (error) => setToast({ severity: "error", message: errorMessage(error), key: Date.now() }),
    }),
    [],
  );

  const confirm = useCallback<Confirm>((options) => {
    setConfirmState(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const answer = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setConfirmState(null);
  };

  return (
    <NotifyContext.Provider value={notifier}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <Snackbar
          key={toast?.key}
          open={toast !== null}
          autoHideDuration={toast?.severity === "error" ? 8000 : 3500}
          onClose={(_event, reason) => reason !== "clickaway" && setToast(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{ bottom: { xs: 24 } }}
        >
          <Alert severity={toast?.severity ?? "success"} variant="filled" onClose={() => setToast(null)} sx={{ maxWidth: 640 }}>
            {toast?.message}
          </Alert>
        </Snackbar>
        <Dialog open={confirmState !== null} onClose={() => answer(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{confirmState?.title}</DialogTitle>
          <DialogContent>
            <DialogContentText>{confirmState?.message}</DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => answer(false)}>Cancelar</Button>
            <Button variant="contained" color={confirmState?.danger ? "error" : "primary"} onClick={() => answer(true)} autoFocus>
              {confirmState?.confirmLabel ?? "Confirmar"}
            </Button>
          </DialogActions>
        </Dialog>
      </ConfirmContext.Provider>
    </NotifyContext.Provider>
  );
}
