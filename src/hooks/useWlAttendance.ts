import { useEffect, useState } from "react";
import type { WlAttendance } from "../model";

/**
 * Registra o módulo no painel do FOCUS Chat e devolve o atendimento aberto
 * (null quando não há nenhum). A biblioteca `wlclient` vem de um script
 * externo, então o hook espera ela aparecer.
 */
export function useWlAttendance(): WlAttendance | null {
  const [attendance, setAttendance] = useState<WlAttendance | null>(null);

  useEffect(() => {
    const register = () => {
      const extension = window.WlExtension;
      if (!extension) return false;
      extension.initialize({
        events: {
          onOpenAttendance: (opened) => setAttendance(opened),
          onCloseAttendance: () => setAttendance(null),
        },
      });
      return true;
    };

    if (register()) return;
    const timer = window.setInterval(() => {
      if (register()) window.clearInterval(timer);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return attendance;
}
