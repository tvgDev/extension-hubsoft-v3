import PersonAdd from "@mui/icons-material/PersonAdd";
import TravelExplore from "@mui/icons-material/TravelExplore";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useAttendance } from "../attendance";
import { TabIntro } from "../components/common";
import { fullRow, twoColumns } from "../components/layout";
import { Section } from "../components/Section";
import { useNotify } from "../components/useFeedback";
import { useLoad } from "../components/useLoad";
import { digitsOnly, formatMoney, phoneDigits } from "../format";
import type { Plan, Viability } from "../model";
import { addNote } from "../services/attendance";
import type { HubsoftApi } from "../services/hubsoftApi";
import { toPlan, toProspect, toViability } from "../services/mappers";

const STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

/** Aba Cobertura: para quem ainda não é cliente, consulta de viabilidade, planos por CEP e cadastro de prospecto. */
export function CoverageTab() {
  const { attendance, api } = useAttendance();
  if (!api) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Sem acesso ao Hubsoft: cadastre as variáveis do sistema com os dados de acesso para consultar cobertura.</Alert>
      </Box>
    );
  }
  const phone = phoneDigits(attendance.contato.numero);
  return (
    <Box sx={{ px: 3, pb: 4 }}>
      <Box sx={{ pt: 3 }}>
        <TabIntro>Para quem ainda não é cliente: confira se o endereço tem cobertura, veja os planos do CEP e cadastre o prospecto no Hubsoft.</TabIntro>
      </Box>
      <ExistingProspect api={api} phone={phone} />
      <ViabilitySection api={api} />
      <ProspectSection api={api} phone={phone} />
    </Box>
  );
}

function ExistingProspect({ api, phone }: { api: HubsoftApi; phone: string }) {
  const prospects = useLoad(() => (phone ? api.findProspects("telefone", phone).then((result) => (result.prospectos ?? []).map(toProspect)) : Promise.resolve([])), phone);
  const found = prospects.data?.[0];
  if (!found) return null;
  return (
    <Alert severity="info">
      Este número já está cadastrado como prospecto no Hubsoft: {found.name}
      {found.createdAt ? ` (desde ${found.createdAt}` : ""}
      {found.createdAt && found.origin ? `, origem ${found.origin})` : found.createdAt ? ")" : ""}.
    </Alert>
  );
}

function ViabilitySection({ api }: { api: HubsoftApi }) {
  const notify = useNotify();
  const [form, setForm] = useState({ street: "", number: "", district: "", city: "", state: "" });
  const [result, setResult] = useState<Viability | null>(null);
  const [busy, setBusy] = useState(false);
  const update = (changes: Partial<typeof form>) => setForm((value) => ({ ...value, ...changes }));
  const ready = Object.values(form).every((value) => value.trim());

  const check = async () => {
    setBusy(true);
    try {
      const response = await api.checkViability({ endereco: form.street.trim(), numero: form.number.trim(), bairro: form.district.trim(), cidade: form.city.trim(), estado: form.state });
      setResult(toViability(response));
    } catch (failure) {
      notify.error(failure);
    } finally {
      setBusy(false);
    }
  };

  const boxes = result?.projects.flatMap((project) => project.boxes.map((box) => ({ ...box, project: project.name }))) ?? [];
  const freePorts = boxes.reduce((total, box) => total + box.available, 0);

  return (
    <Section title="Cobertura por endereço">
      <Stack spacing={3}>
        <Box sx={twoColumns}>
          <TextField label="Endereço" value={form.street} onChange={(event) => update({ street: event.target.value })} sx={fullRow} placeholder="Rua, avenida…" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Número" value={form.number} onChange={(event) => update({ number: event.target.value })} />
          <TextField label="Bairro" value={form.district} onChange={(event) => update({ district: event.target.value })} />
          <TextField label="Cidade" value={form.city} onChange={(event) => update({ city: event.target.value })} />
          <TextField select label="UF" value={form.state} onChange={(event) => update({ state: event.target.value })}>
            {STATES.map((uf) => (
              <MenuItem key={uf} value={uf}>
                {uf}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box>
          <Button variant="contained" startIcon={<TravelExplore />} onClick={() => void check()} disabled={!ready || busy}>
            {busy ? "Consultando…" : "Consultar cobertura"}
          </Button>
        </Box>

        {result && boxes.length === 0 && (
          <Alert severity="warning">Nenhuma caixa de atendimento num raio de 250 m deste endereço. Sem cobertura por aqui, por enquanto.</Alert>
        )}
        {result && boxes.length > 0 && (
          <>
            <Alert severity={freePorts > 0 ? "success" : "warning"}>
              {freePorts > 0
                ? `Tem cobertura: ${boxes.length} caixa(s) perto do endereço, com ${freePorts} porta(s) livre(s). A mais próxima está a ${boxes[0].distance ?? "poucos metros"}.`
                : "Há caixas perto do endereço, mas sem portas livres. Vale pedir uma avaliação técnica antes de fechar a venda."}
            </Alert>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ "& th": { fontWeight: 700 }, "& th, & td": { whiteSpace: "nowrap", px: 1 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Caixa</TableCell>
                    <TableCell>Projeto</TableCell>
                    <TableCell>Distância</TableCell>
                    <TableCell align="right">Livres</TableCell>
                    <TableCell align="right">Reservadas</TableCell>
                    <TableCell align="right">Em uso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boxes.map((box, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{box.name}</TableCell>
                      <TableCell>{box.project}</TableCell>
                      <TableCell>{box.distance ?? "—"}</TableCell>
                      <TableCell align="right">{box.available}</TableCell>
                      <TableCell align="right">{box.reserved}</TableCell>
                      <TableCell align="right">{box.used}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </>
        )}
        {result?.alerts.map((alert, index) => (
          <Alert key={index} severity="info">
            {alert}
          </Alert>
        ))}
      </Stack>
    </Section>
  );
}

interface ProspectForm {
  name: string;
  phone: string;
  personType: "pf" | "pj";
  document: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  planId: string;
  notes: string;
}

function ProspectSection({ api, phone }: { api: HubsoftApi; phone: string }) {
  const { attendance } = useAttendance();
  const notify = useNotify();
  const [form, setForm] = useState<ProspectForm>(() => ({
    name: attendance.contato.nomeSecundario ?? "",
    phone,
    personType: "pf",
    document: "",
    email: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    planId: "",
    notes: "",
  }));
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [saving, setSaving] = useState(false);
  const update = (changes: Partial<ProspectForm>) => setForm((value) => ({ ...value, ...changes }));

  const loadPlans = async () => {
    const cep = digitsOnly(form.cep);
    if (cep.length !== 8) {
      notify.error("Informe o CEP com 8 números para buscar os planos.");
      return;
    }
    setLoadingPlans(true);
    try {
      const list = ((await api.plansByCep(cep)).servicos ?? []).map(toPlan);
      setPlans(list);
      update({ planId: "" });
      if (list.length === 0) notify.error("O Hubsoft não tem planos disponíveis para este CEP.");
    } catch (failure) {
      notify.error(failure);
    } finally {
      setLoadingPlans(false);
    }
  };

  const plan = plans?.find((item) => String(item.id) === form.planId) ?? null;
  const ready =
    form.name.trim() && phoneDigits(form.phone).length >= 10 && digitsOnly(form.cep).length === 8 && form.street.trim() && form.number.trim() && form.district.trim() && plan !== null;

  const save = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const result = await api.createProspect({
        cep: digitsOnly(form.cep),
        servico: { id_servico: plan.id, valor: plan.value },
        nome_razaosocial: form.name.trim(),
        tipo_pessoa: form.personType,
        cpf_cnpj: digitsOnly(form.document) || undefined,
        telefone: phoneDigits(form.phone),
        email: form.email.trim() || undefined,
        observacao: form.notes.trim() || undefined,
        bairro: form.district.trim(),
        endereco: form.street.trim(),
        numero: form.number.trim(),
        complemento: form.complement.trim() || undefined,
      });
      const id = result.prospecto?.id_prospecto;
      await addNote(attendance, `Prospecto cadastrado no Hubsoft pelo atendente${id ? ` (nº ${id})` : ""}: plano ${plan.name}.`);
      notify.success(id ? `Prospecto cadastrado no Hubsoft (nº ${id})` : "Prospecto cadastrado no Hubsoft");
    } catch (failure) {
      notify.error(failure);
    } finally {
      setSaving(false);
    }
  };

  const planLabel = (item: Plan) => {
    const speed = item.download ? ` · ${Math.round(item.download / 1024)} Mega` : "";
    return `${item.name} · ${formatMoney(item.value)}${speed}`;
  };

  return (
    <Section title="Cadastrar prospecto">
      <Stack spacing={3}>
        <Typography color="text.secondary">O prospecto entra no Hubsoft com origem na API, pronto para a equipe comercial fechar a venda.</Typography>
        <Box sx={twoColumns}>
          <TextField label="Nome ou razão social" value={form.name} onChange={(event) => update({ name: event.target.value })} required sx={fullRow} />
          <TextField label="Telefone" value={form.phone} onChange={(event) => update({ phone: event.target.value })} required helperText="DDD e número, só dígitos" />
          <TextField select label="Tipo de pessoa" value={form.personType} onChange={(event) => update({ personType: event.target.value as "pf" | "pj" })}>
            <MenuItem value="pf">Pessoa física</MenuItem>
            <MenuItem value="pj">Pessoa jurídica</MenuItem>
          </TextField>
          <TextField label="CPF ou CNPJ" value={form.document} onChange={(event) => update({ document: event.target.value })} helperText="Opcional nesta etapa" />
          <TextField label="E-mail" value={form.email} onChange={(event) => update({ email: event.target.value })} />
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <TextField label="CEP" value={form.cep} onChange={(event) => update({ cep: event.target.value })} required fullWidth slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 9 } }} />
            <Button variant="outlined" onClick={() => void loadPlans()} disabled={loadingPlans} sx={{ flexShrink: 0, height: 56 }}>
              {loadingPlans ? "Buscando…" : "Buscar planos"}
            </Button>
          </Stack>
          <TextField
            select
            label="Plano"
            value={form.planId}
            onChange={(event) => update({ planId: event.target.value })}
            required
            disabled={!plans || plans.length === 0}
            helperText={plans ? (plans.length ? "Planos disponíveis para o CEP" : "Nenhum plano para este CEP") : "Busque os planos pelo CEP primeiro"}
          >
            {(plans ?? []).map((item) => (
              <MenuItem key={item.id} value={String(item.id)}>
                {planLabel(item)}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Endereço" value={form.street} onChange={(event) => update({ street: event.target.value })} required sx={fullRow} />
          <TextField label="Número" value={form.number} onChange={(event) => update({ number: event.target.value })} required />
          <TextField label="Complemento" value={form.complement} onChange={(event) => update({ complement: event.target.value })} />
          <TextField label="Bairro" value={form.district} onChange={(event) => update({ district: event.target.value })} required sx={fullRow} />
          <TextField
            label="Observações"
            value={form.notes}
            onChange={(event) => update({ notes: event.target.value })}
            multiline
            minRows={2}
            sx={fullRow}
            placeholder="Melhor horário para contato, referência do endereço…"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
        <Box>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => void save()} disabled={!ready || saving}>
            {saving ? "Cadastrando…" : "Cadastrar prospecto"}
          </Button>
        </Box>
      </Stack>
    </Section>
  );
}
