import { useEffect, useState } from "react";
import AlertMessage from "./components/AlertMessage";
import ContactInfo from "./components/ContactInfo";
import CpfCnpjForm from "./components/CpfCnpjForm";
import ClientData, { type ClientDataInfo } from "./components/ClientData";
import Financials from "./components/Financials";
import type { BoletoItem } from "./components/BoletoCard";

import {
  getSystemVariables,
  getContactAttributes,
  setContactAttributes,
  sendWhisper,
  sendMedia,
  sendText,
} from "./services/focuschatApi";
import {
  generateHubsoftToken,
  getClientData,
  getBoletosHubsoft,
  unlockService,
} from "./services/hubsoftApi";

interface WlAttendance {
  atendimentoId: string;
  canalId: string;
  contato: {
    id: string;
    nomeSecundario?: string;
    numero: string;
    linkImagem?: string;
  };
}

function App() {
  const [attendance, setAttendance] = useState<WlAttendance | null>(null);

  // App states
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState<ClientDataInfo | null>(null);
  const [boletos, setBoletos] = useState<BoletoItem[]>([]);

  useEffect(() => {
    const init = () => {
      if (window.WlExtension) {
        console.log("Hubsoft Extension: Inicializando WlExtension...");
        window.WlExtension.initialize({
          events: {
            onOpenAttendance: (att: any) => {
              console.log("Hubsoft Extension: onOpenAttendance recebido", att);
              setAttendance(att);
              loadAppData(att);
            },
            onCloseAttendance: () => {
              console.log("Hubsoft Extension: onCloseAttendance recebido");
              setAttendance(null);
              setClientData(null);
              setBoletos([]);
            },
          },
        });
        return true;
      }
      return false;
    };

    if (!init()) {
      const interval = setInterval(() => {
        if (init()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const loadAppData = async (att: WlAttendance) => {
    setIsLoading(true);
    // IMPORTANTE: Limpar dados anteriores para evitar mostrar dados do cliente anterior
    setClientData(null);
    setBoletos([]);
    
    console.log('Hubsoft Extension: Carregando dados para atendimento', att.atendimentoId);
    
    try {
      // 1. Buscar variáveis
      let sysVars: any[] = [];
      try {
        sysVars = await getSystemVariables(att.canalId);
      } catch (err) {
        console.warn('Hubsoft Extension: Erro ao carregar variáveis do sistema', err);
      }

      // Lógica idêntica ao Módulo Antigo: if (noOpenWidget !== "false") { openWidget() }
      const noOpenVar = sysVars.find((attr: any) => attr.key === "noOpenWidget")?.value;
      console.log('Hubsoft Extension: Valor de noOpenWidget:', noOpenVar);
      
      if (noOpenVar !== "false") {
        console.log('Hubsoft Extension: Chamando openWidget (lógica antiga)');
        if (window.WlExtension && window.WlExtension.openWidget) {
          window.WlExtension.openWidget();
        }
      }

      // 2. See if contact has CPF/CNPJ
      const attrs = await getContactAttributes(att.contato.id, att.canalId);
      const cpfAttr = attrs.find((a: any) => a.Key === "CPFCNPJCliente");
      const cpfAttrValue = cpfAttr?.Value;
      
      if (cpfAttrValue) {
        console.log('Hubsoft Extension: CPF encontrado, buscando na Hubsoft:', cpfAttrValue);
        await fetchHubsoftData(cpfAttrValue, sysVars);
      } else {
        console.log('Hubsoft Extension: CPF não encontrado para este contato.');
      }
    } catch (error) {
      console.error('Hubsoft Extension: Erro crítico em loadAppData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCpfCnpj = async (novoValor: string) => {
    if (!attendance) return;
    setIsLoading(true);

    try {
      const resp = await setContactAttributes(
        attendance.contato.id,
        attendance.canalId,
        [
          {
            key: "CPFCNPJCliente",
            value: novoValor,
            description: "CPFCNPJCliente",
          },
        ],
      );

      if (resp.status === "200") {
        console.log("CPF/CNPJ salvo com sucesso!");

        // Agora busca os dados na Hubsoft usando esse novo CPF
        const sysVars = await getSystemVariables(attendance.canalId);
        await fetchHubsoftData(novoValor, sysVars);
      } else {
        console.error("Erro ao salvar CPF/CNPJ:", resp.msg);
      }
    } catch (error) {
      console.error("Erro salvar o atributo CPF/CNPJ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHubsoftData = async (documento: string, sysVars: any[]) => {
    try {
      const urlHubsoft = sysVars.find(
        (item: any) => item.key === "1UrlHubsoft",
      )?.value;
      const userHubsoft = sysVars.find(
        (item: any) => item.key === "1UserHubsoft",
      )?.value;
      const passHubsoft = sysVars.find(
        (item: any) => item.key === "1PassHubsoft",
      )?.value;
      const clientId = sysVars.find(
        (item: any) => item.key === "1CliendIdHubsoft",
      )?.value;
      const clientSecret = sysVars.find(
        (item: any) => item.key === "1ClientSecretHubsoft",
      )?.value;

      if (
        !urlHubsoft ||
        !userHubsoft ||
        !passHubsoft ||
        !clientId ||
        !clientSecret
      ) {
        console.error("Credenciais da Hubsoft não configuradas no sistema.");
        return;
      }

      const tokenData = await generateHubsoftToken(
        urlHubsoft,
        clientId,
        clientSecret,
        userHubsoft,
        passHubsoft,
      );
      const token = tokenData.access_token;

      const clientResp = await getClientData(urlHubsoft, token, documento);

      if (
        clientResp.status === "success" &&
        clientResp.clientes &&
        clientResp.clientes.length > 0
      ) {
        const c = clientResp.clientes[0];
        const servico = c.servicos[0];

        const mappedData: ClientDataInfo = {
          nome_razaosocial: c.nome_razaosocial,
          cpf_cnpj: c.cpf_cnpj,
          telefone_primario: c.telefone_primario,
          email_principal: c.email_principal,
          plano: servico?.nome,
          status: servico?.status,
          endereco: servico?.endereco_instalacao?.completo,
          id_cliente_servico: servico?.id_cliente_servico,
        };

        setClientData(mappedData);

        if (mappedData.id_cliente_servico) {
          const boletoResp = await getBoletosHubsoft(
            urlHubsoft,
            token,
            mappedData.id_cliente_servico,
          );
          if (boletoResp && boletoResp.faturas) {
            setBoletos(boletoResp.faturas);
          }
        }
      } else {
        console.warn("Cliente não encontrado na Hubsoft.");
      }
    } catch (error) {
      console.error("Erro de comunicação com a Hubsoft:", error);
    }
  };

  const handleUnlockService = async () => {
    if (!attendance || !clientData?.id_cliente_servico) return;

    window.WlExtension?.confirmDialog({
      title: "Confirmar desbloqueio",
      text: "Deseja realmente realizar o desbloqueio em confiança para este serviço?",
      callback: async (confirm) => {
        if (confirm) {
          setIsLoading(true);
          try {
            const sysVars = await getSystemVariables(attendance.canalId);
            const urlHubsoft = sysVars.find((item: any) => item.key === "1UrlHubsoft")?.value;
            const userHubsoft = sysVars.find((item: any) => item.key === "1UserHubsoft")?.value;
            const passHubsoft = sysVars.find((item: any) => item.key === "1PassHubsoft")?.value;
            const clientId = sysVars.find((item: any) => item.key === "1CliendIdHubsoft")?.value;
            const clientSecret = sysVars.find((item: any) => item.key === "1ClientSecretHubsoft")?.value;

            const tokenData = await generateHubsoftToken(urlHubsoft, clientId, clientSecret, userHubsoft, passHubsoft);
            const token = tokenData.access_token;

            const result = await unlockService(urlHubsoft, token, clientData.id_cliente_servico!);

            if (result.status === "success") {
              setClientData(prev => prev ? { ...prev, status: "ativo" } : null);
              
              window.WlExtension.alert({
                message: "Serviço desbloqueado com sucesso!",
                variant: "success"
              });

              await sendWhisper(attendance.contato.id, attendance.canalId, "Serviço desbloqueado em confiança pelo atendente.");
            } else {
              window.WlExtension.alert({
                message: result.message || "Erro ao realizar desbloqueio.",
                variant: "error"
              });
            }
          } catch (error) {
            console.error("Erro ao desbloquear serviço:", error);
            window.WlExtension.alert({
              message: "Erro na comunicação com o servidor.",
              variant: "error"
            });
          } finally {
            setIsLoading(false);
          }
        }
      },
    });
  };

  const handleSendBoletoAction = async (
    type: "Pix" | "Código de Barras" | "PDF do Boleto",
    message: string,
  ) => {
    if (!attendance) return;

    if (window.WlExtension?.confirmDialog) {
      window.WlExtension.confirmDialog({
        title: "Confirmar envio",
        text: `Deseja enviar ${type} ao cliente?`,
        callback: async (confirm) => {
          if (confirm) {
            setIsLoading(true);
            try {
              const canalId = attendance.canalId;
              const contatoId = attendance.contato.id;
              let success = false;
              let whisperMsg = "";

              if (type === "PDF do Boleto") {
                success = await sendMedia(
                  contatoId,
                  canalId,
                  message,
                  "Boleto em PDF",
                  "Boleto em PDF",
                  ".pdf",
                );
                whisperMsg = `PDF do Boleto enviado ao cliente pelo sistema.`;
              } else {
                success = await sendText(contatoId, canalId, message);
                if (type === "Pix") {
                  whisperMsg = `PIX Enviado ao cliente pelo sistema.`;
                  // Envia também o QR Code do PIX (Baseado no index.html original)
                  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(message)}`;
                  await sendMedia(
                    contatoId,
                    canalId,
                    qrCodeUrl,
                    "QRCode PIX",
                    "QR Code do PIX",
                    ".png",
                  );
                } else {
                  whisperMsg = `Código de Barras enviado ao cliente pelo sistema.`;
                }
              }

              if (success) {
                await sendWhisper(contatoId, canalId, whisperMsg);
                console.log("Conteúdo enviado com sucesso!");
              }
            } catch (error) {
              console.error("Erro ao enviar conteúdo:", error);
            } finally {
              setIsLoading(false);
            }
          }
        },
      });
    }
  };

  return (
    <div className="container mx-auto p-[15px] bg-[#f8f9fa] min-h-screen">
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 animate-pulse">
          <div className="w-12 h-12 border-4 border-[var(--primary)]/10 border-t-[var(--primary)] rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 font-medium text-sm">
            Sincronizando com Hubsoft...
          </p>
        </div>
      )}

      {!isLoading && attendance && (
        <div className="space-y-1 animate-fade-in">
          <ContactInfo
            name={attendance.contato.nomeSecundario || "Cliente"}
            number={attendance.contato.numero}
            avatarUrl={attendance.contato.linkImagem}
          />

          {clientData ? (
            <>
              <ClientData client={clientData} onUnlock={handleUnlockService} />
              <Financials
                boletos={boletos}
                onSendAction={handleSendBoletoAction}
              />
            </>
          ) : (
            <>
              <AlertMessage
                message="Atributo CPF ou CNPJ do cliente não encontrado. Por favor, localize-o manualmente."
                type="warning"
              />
              <CpfCnpjForm onSubmit={saveCpfCnpj} isLoading={isLoading} />
            </>
          )}
        </div>
      )}

      {!isLoading && !attendance && (
        <div className="py-8 animate-fade-in text-center flex flex-col items-center">
          <AlertMessage
            message="Você precisa abrir um atendimento ativo para sincronizar os dados do Hubsoft."
            type="info"
          />
          <div className="opacity-20 mt-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
