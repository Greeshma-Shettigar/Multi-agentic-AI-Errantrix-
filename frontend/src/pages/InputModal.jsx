import { useState } from "react";
import "../styles/InputModal.css";

export default function InputModal({
  show,
  title,
  placeholder,
  onSubmit,
  onClose,
}) {
  const [value, setValue] = useState("");

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h4 className="modal-title">{title}</h4>

        <input
          autoFocus
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="modal-input"
        />

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn-submit"
            onClick={() => {
              onSubmit(value);
              setValue("");
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
