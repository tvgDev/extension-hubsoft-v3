import React from 'react';

export interface BoletoItem {
  id?: string;
  data_vencimento: string;
  valor: number;
  status: string;
  linha_digitavel?: string;
  pix_copia_cola?: string;
  link?: string;
  data_pagamento?: string;
  detalhamento?: Array<{descricao: string, valor: number}>;
}

interface BoletoCardProps {
  boleto: BoletoItem;
  onSendAction: (type: 'Pix' | 'Código de Barras' | 'PDF do Boleto', message: string) => void;
}

const BoletoCard: React.FC<BoletoCardProps> = ({ boleto, onSendAction }) => {
  const status = (boleto.status || '').toLowerCase();
  const isPaid = status === 'pago' || status === 'liquidado';
  
  const getStatusStyle = () => {
    if (isPaid) return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'cancelado') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'aguardando' || status === 'em aberto') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="boleto-card group">
      <div className="grid grid-cols-3 gap-3 items-start text-left mb-3">
        <div className="small-text border-r border-gray-100 last:border-0 pr-2">
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Vencimento</label> 
          <div className="font-semibold text-gray-700">{boleto.data_vencimento}</div>
        </div>
        
        <div className="small-text border-r border-gray-100 last:border-0 pr-2 px-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Valor</label> 
          <div className="font-bold text-[var(--primary)] text-sm">R$ {boleto.valor.toFixed(2)}</div>
        </div>
        
        <div className="small-text">
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Status</label>
          <div className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusStyle()}`}>
            {boleto.status}
          </div>
        </div>
      </div>

      {!isPaid && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
          {boleto.pix_copia_cola && (
            <button 
              className="btn-icon flex-1 min-w-[120px] h-[42px]" 
              onClick={() => onSendAction('Pix', boleto.pix_copia_cola!)}
              title="Enviar Pix"
            >
              <img src="https://focuschat.com.br/extensoes/sgp-modules-v2/img/icons/pix.png" alt="Pix" className="w-5 h-5 object-contain mr-2" />
              <span className="font-semibold text-[11px] whitespace-nowrap">Enviar PIX</span>
            </button>
          )}

          {boleto.linha_digitavel && (
            <button 
              className="btn-icon flex-1 min-w-[120px] h-[42px]" 
              onClick={() => onSendAction('Código de Barras', boleto.linha_digitavel!)}
              title="Enviar Código de Barras"
            >
              <img src="https://focuschat.com.br/extensoes/sgp-modules-v2/img/icons/codigobarras.png" alt="Barcode" className="w-5 h-5 object-contain mr-2" />
              <span className="font-semibold text-[11px] whitespace-nowrap">Boleto / Linha</span>
            </button>
          )}

          {boleto.link && (
            <button 
              className="btn-icon flex-1 min-w-[120px] h-[42px]" 
              onClick={() => onSendAction('PDF do Boleto', boleto.link!)}
              title="Enviar PDF"
            >
              <img src="https://focuschat.com.br/extensoes/sgp-modules-v2/img/icons/pdf.png" alt="PDF" className="w-5 h-5 object-contain mr-2" />
              <span className="font-semibold text-[11px] whitespace-nowrap">Visualizar PDF</span>
            </button>
          )}
        </div>
      )}

      {boleto.detalhamento && boleto.detalhamento.length > 0 && (
        <div className="mt-3 p-2 bg-gray-50/50 rounded-lg">
          <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Detalhamento</label>
          <ul className="text-[11px] text-gray-500 space-y-1">
            {boleto.detalhamento.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span>{item.descricao}</span>
                <span className="font-medium">R$ {item.valor.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isPaid && boleto.data_pagamento && (
        <div className="flex items-center mt-3 pt-3 border-t border-gray-100/50">
          <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mr-3">
            <img src="https://focuschat.com.br/extensoes/sgp-modules-v2/img/icons/pago.png" alt="Pago" width="16" height="16" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">Pago em</span>
            <span className="text-sm font-semibold text-green-700">{boleto.data_pagamento}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoletoCard;
