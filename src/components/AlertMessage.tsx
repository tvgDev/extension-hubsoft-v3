import React from 'react';

interface AlertMessageProps {
  message: string;
  type?: 'warning' | 'info' | 'error';
}

const AlertMessage: React.FC<AlertMessageProps> = ({ message, type = 'warning' }) => {
  const getColors = () => {
    switch (type) {
      case 'error': return 'bg-rose-50 text-rose-700 border-rose-200 shadow-rose-100/50';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100/50';
      default: return 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100/50';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
    }
  };

  return (
    <div className={`p-4 rounded-xl border shadow-sm animate-fade-in mb-4 ${getColors()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 opacity-80 mt-0.5">
          {getIcon()}
        </div>
        <p className="text-[13px] font-medium leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

export default AlertMessage;
