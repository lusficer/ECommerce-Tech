// Reusable modal wrapper with a scrollable body

'use client';

import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  // Max width Tailwind class.
  maxWidth?: string;
  // Optional extra class for the header background.
  headerClassName?: string;
  // Optional icon shown left of the title.
  titleIcon?: React.ReactNode;
}

// Generic modal with a dimmed backdrop.
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
  headerClassName = 'bg-slate-50',
  titleIcon,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        // Only close when clicking the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        <div
          className={`flex items-center justify-between p-5 border-b border-slate-100 ${headerClassName}`}
        >
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            {titleIcon}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
