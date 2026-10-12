import { useMemo, useState } from "react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { AttendanceContext, defaultService, type AttendanceState } from "./attendance";
import { useLoad } from "./components/useLoad";
import { useWlAttendance } from "./hooks/useWlAttendance";
import type { Service, WlAttendance } from "./model";
import { Home } from "./pages/Home";
import { Welcome } from "./pages/Welcome";
import { loadAttendance } from "./services/attendance";
import { HubsoftApi } from "./services/hubsoftApi";

export function App() {
  const attendance = useWlAttendance();
  if (!attendance) return <Welcome />;
  // A chave remonta tudo quando outro atendimento abre: nada do cliente anterior fica na tela.
  return <AttendancePanel key={attendance.atendimentoId} attendance={attendance} />;
}

function AttendancePanel({ attendance }: { attendance: WlAttendance }) {
  const loaded = useLoad(() => loadAttendance(attendance), attendance.atendimentoId);
  const [serviceId, setServiceId] = useState<number | null>(null);

  const credentials = loaded.data?.credentials ?? null;
  const api = useMemo(() => (credentials ? new HubsoftApi(credentials) : null), [credentials]);
  const services = loaded.data?.client?.services ?? [];
  const service = services.find((item) => item.id === serviceId) ?? defaultService(services);

  const updateService = (id: number, changes: Partial<Service>) => {
    const data = loaded.data;
    if (!data?.client) return;
    loaded.setData({ ...data, client: { ...data.client, services: data.client.services.map((item) => (item.id === id ? { ...item, ...changes } : item)) } });
  };

  const state: AttendanceState = { attendance, ...loaded, api, service, selectService: setServiceId, updateService };

  // As abas são rotas, mas o módulo roda dentro do painel do FOCUS Chat e não
  // deve mexer na URL nem no histórico do navegador: router em memória, um por
  // atendimento, sempre começando na aba Cliente.
  return (
    <AttendanceContext.Provider value={state}>
      <MemoryRouter initialEntries={["/cliente"]}>
        <Routes>
          <Route path="/cliente" element={<Home tab="cliente" />} />
          <Route path="/conexao" element={<Home tab="conexao" />} />
          <Route path="/financeiro" element={<Home tab="financeiro" />} />
          <Route path="/chamados" element={<Home tab="chamados" />} />
          <Route path="/cobertura" element={<Home tab="cobertura" />} />
          <Route path="*" element={<Navigate to="/cliente" replace />} />
        </Routes>
      </MemoryRouter>
    </AttendanceContext.Provider>
  );
}
