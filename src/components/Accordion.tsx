import React, { useState } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="info-section animate-fade-in">
      <div 
        className="section-header group" 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
      >
        <h6>{title}</h6>
        <span className={`minimize-icon transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`}>
          {isOpen ? '−' : '+'}
        </span>
      </div>
      
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="section-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accordion;
