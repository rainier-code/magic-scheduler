import {
  FaExclamationTriangle,
  FaCheck,
} from "react-icons/fa";

function ConfirmModal({
  title = "Delete Event",
  message = "Are you sure you want to delete this event?",
  type = "warning",
  onConfirm,
  onCancel,
  confirmText = "Delete Event",
  cancelText = "Cancel",
}) {
  const icon =
    type === "success" ? (
      <FaCheck />
    ) : (
      <FaExclamationTriangle />
    );

  return (
    <div
      className="confirm-modal-overlay"
      onClick={onCancel}
    >
      <div
        className="confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`confirm-modal-icon ${type}`}
        >
          {icon}
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="confirm-modal-actions">
          {cancelText && (
            <button
              type="button"
              className="confirm-cancel-button"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className={
              type === "success"
                ? "confirm-success-button"
                : "confirm-delete-button"
            }
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;