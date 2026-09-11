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
    <div className="info-section animate-fade-in p-6">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-amber-100 shadow-sm text-amber-500">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-slate-800 font-bold text-center mb-1.5 text-[15px]">CPF/CNPJ Não Encontrado</h3>
        <p className="text-slate-500 text-[13px] text-center mb-6 max-w-[240px] leading-relaxed">
          Não localizamos o documento deste cliente. Por favor, insira-o manualmente abaixo:
        </p>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="relative">
            <input 
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400 shadow-sm"
              placeholder="000.000.000-00" 
              maxLength={18}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando...
              </span>
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
