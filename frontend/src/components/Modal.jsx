import { AlertCircle, HelpCircle } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'alert', // 'alert' or 'confirm'
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          {type === 'alert' ? (
            <AlertCircle color="var(--primary)" size={32} />
          ) : (
            <HelpCircle color="var(--primary)" size={32} />
          )}
          <h2 style={{ margin: 0 }}>{title}</h2>
        </div>
        
        <div className="modal-body">
          {message}
        </div>
        
        <div className="modal-actions">
          {type === 'confirm' && (
            <button className="btn btn-outline" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
