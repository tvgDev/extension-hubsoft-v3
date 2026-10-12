import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { AttendanceContext } from "./attendance";
import { useLoad } from "./components/useLoad";
import { useWlAttendance } from "./hooks/useWlAttendance";
import type { WlAttendance } from "./model";
import { Home } from "./pages/Home";
import { Welcome } from "./pages/Welcome";
import { loadAttendance } from "./services/attendance";

export function App() {
  const attendance = useWlAttendance();
  if (!attendance) return <Welcome />;
  // A chave remonta tudo quando outro atendimento abre: nada do cliente anterior fica na tela.
  return <AttendancePanel key={attendance.atendimentoId} attendance={attendance} />;
}

function AttendancePanel({ attendance }: { attendance: WlAttendance }) {
  const loaded = useLoad(() => loadAttendance(attendance), attendance.atendimentoId);

  // As abas são rotas, mas o módulo roda dentro do painel do FOCUS Chat e não
  // deve mexer na URL nem no histórico do navegador: router em memória, um por
  // atendimento, sempre começando na aba Cliente.
  return (
    <AttendanceContext.Provider value={{ attendance, ...loaded }}>
      <MemoryRouter initialEntries={["/cliente"]}>
        <Routes>
          <Route path="/cliente" element={<Home tab="cliente" />} />
          <Route path="/financeiro" element={<Home tab="financeiro" />} />
          <Route path="*" element={<Navigate to="/cliente" replace />} />
        </Routes>
      </MemoryRouter>
    </AttendanceContext.Provider>
  );
}
