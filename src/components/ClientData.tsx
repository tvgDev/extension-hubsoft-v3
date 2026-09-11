import React from 'react';
import Accordion from './Accordion';

export interface ClientDataInfo {
  nome_razaosocial: string;
  cpf_cnpj: string;
  telefone_primario: string;
  email_principal: string;
  plano?: string;
  status?: string;
  endereco?: string;
  id_cliente_servico?: number;
}

interface ClientDataProps {
  client: ClientDataInfo;
  onUnlock?: () => void;
}

const ClientData: React.FC<ClientDataProps> = ({ client, onUnlock }) => {
  const needsUnlock = client.status && ['suspenso', 'bloqueado', 'suspenso_parcialmente'].includes(client.status.toLowerCase());

  return (
    <Accordion title="DADOS DO CLIENTE">
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Razão Social / Nome</span>
          <span className="text-[15px] font-semibold text-slate-800 leading-tight">{client.nome_razaosocial}</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CPF / CNPJ</span>
          <span className="text-[15px] font-medium text-slate-600">{client.cpf_cnpj}</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contato</span>
          <span className="text-[15px] font-medium text-slate-600">{client.telefone_primario}</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">E-mail</span>
          <span className="text-[15px] font-medium text-slate-600 break-all">{client.email_principal}</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plano Atual</span>
          <span className="text-[15px] font-bold text-[var(--accent)] leading-tight">{client.plano || 'N/A'}</span>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status do Serviço</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] inline-flex w-fit px-2.5 py-1 rounded-lg font-bold uppercase tracking-wide ${client.status?.toLowerCase() === 'ativo' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200/50'}`}>
              {client.status || 'N/A'}
            </span>
            {needsUnlock && (
              <button 
                onClick={(e) => { e.stopPropagation(); onUnlock?.(); }}
                className="text-[11px] bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white px-3 py-1 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 font-bold uppercase active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Desbloquear
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Endereço de Instalação</span>
          <span className="text-[14px] text-slate-600 leading-snug">{client.endereco || 'N/A'}</span>
        </div>
      </div>
    </Accordion>
  );
};

export default ClientData;
