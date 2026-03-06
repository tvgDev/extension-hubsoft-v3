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
}

const ClientData: React.FC<ClientDataProps> = ({ client }) => {
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
          <span className={`text-[10px] inline-flex w-fit px-2 py-0.5 rounded-full font-bold border uppercase ${client.status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
            {client.status || 'N/A'}
          </span>
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
