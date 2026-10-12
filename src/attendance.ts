import { createContext, useContext } from "react";
import type { AttendanceData, WlAttendance } from "./model";

/** Atendimento aberto + dados carregados do Hubsoft, compartilhados pelas abas. */
export interface AttendanceState {
  attendance: WlAttendance;
  data: AttendanceData | null;
  error: string | null;
  loading: boolean;
  reload(): Promise<void>;
  setData(value: AttendanceData): void;
}

export const AttendanceContext = createContext<AttendanceState | null>(null);

export function useAttendance(): AttendanceState {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error("useAttendance fora do AttendanceContext");
  return context;
}
