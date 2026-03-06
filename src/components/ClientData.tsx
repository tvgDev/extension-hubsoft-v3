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
    <Accordion title="Dados do Cliente">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 py-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Razão Social / Nome</span>
          <span className="text-sm font-semibold text-[var(--primary)]">{client.nome_razaosocial}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">CPF / CNPJ</span>
          <span className="text-sm font-medium text-gray-600">{client.cpf_cnpj}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Contato</span>
          <span className="text-sm font-medium text-gray-600">{client.telefone_primario}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">E-mail</span>
          <span className="text-sm font-medium text-gray-600 truncate">{client.email_principal}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Plano Atual</span>
          <span className="text-sm font-bold text-[var(--accent)]">{client.plano || 'N/A'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status do Serviço</span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] inline-flex w-fit px-2 py-0.5 rounded-full font-bold border uppercase ${client.status?.toLowerCase() === 'ativo' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
              {client.status || 'N/A'}
            </span>
            {needsUnlock && (
              <button 
                onClick={(e) => { e.stopPropagation(); onUnlock?.(); }}
                className="text-[10px] bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 font-bold uppercase"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Desbloquear
              </button>
            )}
          </div>
        </div>
        <div className="md:col-span-2 pt-2 border-t border-gray-50 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Endereço de Instalação</span>
          <span className="text-[13px] text-gray-600 leading-snug">{client.endereco || 'N/A'}</span>
        </div>
      </div>
    </Accordion>
  );
};

export default ClientData;
