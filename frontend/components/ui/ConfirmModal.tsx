"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  type = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  
  const colors = {
    danger: 'bg-danger text-white hover:bg-danger/90 shadow-danger/20',
    warning: 'bg-warning text-white hover:bg-warning/90 shadow-warning/20',
    info: 'bg-primary text-white hover:bg-primary/90 shadow-primary/20',
  };

  const iconColors = {
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-primary/10 text-primary',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconColors[type]}`}>
          <AlertTriangle size={32} />
        </div>
        <p className="mb-8 text-sm text-[#6c757d] leading-relaxed">
          {message}
        </p>
        <div className="flex w-full gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e9ebec] py-2.5 text-sm font-bold text-[#343a40] hover:bg-[#f8f8fb] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-70 ${colors[type]}`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
