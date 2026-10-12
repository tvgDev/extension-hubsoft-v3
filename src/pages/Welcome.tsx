import Alert from "@mui/material/Alert";
import { CenteredFrame } from "./CenteredFrame";

/** Sem atendimento aberto no painel: tela de entrada com o degradê do FOCUS Chat. */
export function Welcome() {
  return (
    <CenteredFrame title="Hubsoft" subtitle="Integração com o FOCUS Chat">
      <Alert severity="info">Abra um atendimento no FOCUS Chat para ver aqui o cadastro do cliente no Hubsoft e as faturas em aberto.</Alert>
    </CenteredFrame>
  );
}
