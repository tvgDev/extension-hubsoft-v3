import { createContext, useContext } from "react";
import type { AttendanceData, Service, WlAttendance } from "./model";
import type { HubsoftApi } from "./services/hubsoftApi";

/** Atendimento aberto + dados carregados do Hubsoft, compartilhados pelas abas. */
export interface AttendanceState {
  attendance: WlAttendance;
  data: AttendanceData | null;
  error: string | null;
  loading: boolean;
  reload(): Promise<void>;
  setData(value: AttendanceData): void;
  /** Cliente da API do Hubsoft; null enquanto não há credenciais. */
  api: HubsoftApi | null;
  /** Serviço em uso nas abas (o cliente pode ter mais de um). */
  service: Service | null;
  selectService(id: number): void;
  updateService(id: number, changes: Partial<Service>): void;
}

export const AttendanceContext = createContext<AttendanceState | null>(null);

export function useAttendance(): AttendanceState {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error("useAttendance fora do AttendanceContext");
  return context;
}

/** Primeiro serviço que não está cancelado nem inativo; senão o primeiro da lista. */
export function defaultService(services: Service[]): Service | null {
  return services.find((item) => !["cancelado", "inativo"].includes(item.statusKey)) ?? services[0] ?? null;
}
