import { useEffect } from "react";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(onClose, 3600);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="app-toast" role="status" aria-live="polite">
      <FaCheckCircle aria-hidden="true" />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">
        <FaTimes aria-hidden="true" />
      </button>
    </div>
  );
}

export default Toast;
