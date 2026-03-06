import React from 'react';
import Accordion from './Accordion';

interface ContactInfoProps {
  name: string;
  number: string;
  avatarUrl?: string;
}

const ContactInfo: React.FC<ContactInfoProps> = ({ name, number, avatarUrl }) => {
  const fallbackAvatar = 'https://axy7gbdyolcg.compat.objectstorage.eu-frankfurt-1.oraclecloud.com/media01/avatar-default-icon.png';
  
  return (
    <Accordion title="Dados do atendimento">
      <div className="flex items-center gap-4 py-2">
        <div className="relative">
          <img 
            src={avatarUrl || fallbackAvatar} 
            alt="Foto do Contato" 
            className="w-20 h-20 rounded-2xl shadow-md border-2 border-white object-cover"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Nome no WhatsApp</div>
          <div className="text-base font-bold text-[var(--primary)] leading-tight">{name}</div>
          <div className="flex items-center gap-1.5 mt-1 text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span className="text-sm font-medium">{number}</span>
          </div>
        </div>
      </div>
    </Accordion>
  );
};

export default ContactInfo;
