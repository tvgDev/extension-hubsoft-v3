import React, { useState } from 'react';

interface CpfCnpjFormProps {
  onSubmit: (value: string) => void;
  isLoading?: boolean;
}

const CpfCnpjForm: React.FC<CpfCnpjFormProps> = ({ onSubmit, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
    }
  };

  return (
    <div className="info-section animate-fade-in">
      <div className="section-content flex flex-col items-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-amber-50/50">
          <img 
            src="https://focuschat.com.br/extensoes/sgp-modules-v2/img/icons/alerta.png" 
            alt="Alerta" 
            className="w-10 h-10 object-contain"
          />
        </div>
        
        <h3 className="text-[var(--primary)] font-bold text-center mb-2">CPF/CNPJ Não Encontrado</h3>
        <p className="text-gray-500 text-sm text-center mb-6 max-w-[240px]">
          Não localizamos o documento deste cliente. Por favor, insira-o manualmente abaixo:
        </p>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input 
              type="text"
              className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all outline-none text-gray-700 font-medium placeholder:text-gray-400"
              placeholder="000.000.000-00" 
              maxLength={18}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Buscando...</span>
              </>
            ) : (
              'Localizar Cliente'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CpfCnpjForm;
