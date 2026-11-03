import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[28px] sm:rounded-[32px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] border-2 border-white/90 dark:border-slate-700 z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 my-auto`}
      >
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 sm:py-5 border-b border-white/60 dark:border-slate-800 shrink-0">
          <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-xl tracking-tight truncate pr-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="clay-interactive p-2 rounded-2xl bg-white/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white shadow-clay-pill border border-white dark:border-slate-700 cursor-pointer shrink-0"
            aria-label="Yopish"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        <div className="p-4 sm:p-7 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
