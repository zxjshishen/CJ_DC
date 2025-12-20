import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle className="text-red-600" size={24} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{message}</p>
            <div className="flex justify-end gap-3">
                <button 
                    onClick={onCancel} 
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                    取消
                </button>
                <button 
                    onClick={onConfirm} 
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg"
                >
                    确认执行
                </button>
            </div>
        </div>
    </div>
  );
};