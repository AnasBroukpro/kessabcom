import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  show: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  show,
  isDeleting,
  deleteError,
  onClose,
  onConfirm
}: DeleteConfirmationModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-2xl font-black text-on-surface text-center mb-2 font-headline">تأكيد الحذف</h3>
        <p className="text-on-surface-variant text-center mb-6">واش متأكد بغيتي تمسح هاد الإعلان؟ هاد العملية مايمكنش ترجع فيها.</p>
        
        {deleteError && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-center text-sm font-bold">
            {deleteError}
          </div>
        )}

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button 
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 bg-error text-on-error font-bold rounded-xl hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />
                <span>جاري المسح...</span>
              </>
            ) : (
              <span>نعم، مسح</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
