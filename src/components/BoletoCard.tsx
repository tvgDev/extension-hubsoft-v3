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
    if (isPaid) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50';
    if (status === 'cancelado') return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/50';
    if (status === 'aguardando' || status === 'em aberto') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50';
    return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/50';
  };

  return (
    <div className="boleto-card group">
      <div className="grid grid-cols-3 gap-3 items-start text-left mb-4">
        <div className="flex flex-col gap-1 pr-2">
          <label className="text-[10px] uppercase font-bold text-slate-400">Vencimento</label> 
          <div className="font-semibold text-slate-800 text-[14px]">{boleto.data_vencimento}</div>
        </div>
        
        <div className="flex flex-col gap-1 pr-2 px-1">
          <label className="text-[10px] uppercase font-bold text-slate-400">Valor</label> 
          <div className="font-bold text-[var(--primary)] text-[15px]">R$ {boleto.valor.toFixed(2)}</div>
        </div>
        
        <div className="flex flex-col gap-1 items-start">
          <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
          <div className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${getStatusStyle()}`}>
            {boleto.status}
          </div>
        </div>
      </div>

      {!isPaid && (
        <div className="flex flex-col gap-2.5 pt-3">
          {boleto.pix_copia_cola && (
            <button 
              className="btn-icon w-full" 
              onClick={() => onSendAction('Pix', boleto.pix_copia_cola!)}
              title="Enviar Pix"
            >
              <svg className="w-4 h-4 text-emerald-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.965 24c4.108 0 7.825-1.637 10.536-4.288l-6.842-6.842L11.965 16.5l-3.693-3.63-6.842 6.842C4.14 22.363 7.857 24 11.965 24zM1.429 11.965c0 1.258.318 2.44.86 3.498l6.012-6.012-3.663-3.663-6.042 6.043c-.542 1.058-.86 2.24-.86 3.498zM22.502 11.965c0-1.258-.318-2.44-.86-3.498l-6.013 6.013 3.664 3.663 6.042-6.043c.542-1.058.86-2.24.86-3.498zM11.965 0C7.857 0 4.14 1.637 1.429 4.288l6.842 6.842L11.965 7.5l3.694 3.63 6.842-6.842C19.79 1.637 16.073 0 11.965 0z"/>
              </svg>
              <span className="font-semibold text-[13px]">Enviar PIX</span>
            </button>
          )}

          {boleto.linha_digitavel && (
            <button 
              className="btn-icon w-full" 
              onClick={() => onSendAction('Código de Barras', boleto.linha_digitavel!)}
              title="Enviar Código de Barras"
            >
              <svg className="w-4 h-4 text-slate-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h2v16H3V4zm4 0h1v16H7V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h2v16h-2V4z" />
              </svg>
              <span className="font-semibold text-[13px]">Boleto / Linha</span>
            </button>
          )}

          {boleto.link && (
            <button 
              className="btn-icon w-full" 
              onClick={() => onSendAction('PDF do Boleto', boleto.link!)}
              title="Enviar PDF"
            >
              <svg className="w-4 h-4 text-rose-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-6 4h6m-4-8h4" />
              </svg>
              <span className="font-semibold text-[13px]">Visualizar PDF</span>
            </button>
          )}
        </div>
      )}

      {boleto.detalhamento && boleto.detalhamento.length > 0 && (
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Detalhamento</label>
          <ul className="text-[12px] text-slate-600 space-y-1.5">
            {boleto.detalhamento.map((item, index) => (
              <li key={index} className="flex justify-between items-start gap-4">
                <span className="flex-1 leading-snug">{item.descricao}</span>
                <span className="font-semibold text-slate-700 whitespace-nowrap">R$ {item.valor.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isPaid && boleto.data_pagamento && (
        <div className="flex items-center mt-4 pt-3 border-t border-slate-100">
          <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center mr-3 ring-1 ring-emerald-200/50 text-emerald-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Pago em</span>
            <span className="text-[13px] font-bold text-emerald-700">{boleto.data_pagamento}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoletoCard;
