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
      <Accordion title="Financeiro (Abertos)">
         <div className="p-4 text-center text-gray-500 italic bg-white rounded-lg shadow-sm border border-gray-100">
            Nenhuma fatura em aberto encontrada para este cliente.
         </div>
      </Accordion>
    );
  }

  return (
    <div id="boletos-list">
      <Accordion title="Financeiro (Abertos)">
        <div className="flex flex-col gap-4">
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
