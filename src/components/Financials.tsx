import React from 'react';
import Accordion from './Accordion';
import BoletoCard, { type BoletoItem } from './BoletoCard';

interface FinancialsProps {
  boletos: BoletoItem[];
  onSendAction: (type: 'Pix' | 'Código de Barras' | 'PDF do Boleto', message: string) => void;
}

const Financials: React.FC<FinancialsProps> = ({ boletos, onSendAction }) => {
  if (!boletos || boletos.length === 0) {
    return (
      <Accordion title="FINANCEIRO (ABERTOS)">
         <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[13px] font-medium">Nenhuma fatura em aberto encontrada.</span>
         </div>
      </Accordion>
    );
  }

  return (
    <div id="boletos-list">
      <Accordion title="FINANCEIRO (ABERTOS)">
        <div className="flex flex-col gap-4 py-2">
          {boletos.map((boleto, index) => (
            <BoletoCard 
              key={boleto.id || index} 
              boleto={boleto} 
              onSendAction={onSendAction} 
            />
          ))}
        </div>
      </Accordion>
    </div>
  );
};

export default Financials;
