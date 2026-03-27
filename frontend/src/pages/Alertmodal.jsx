import { Modal, Button } from "react-bootstrap";
import {
  CheckCircleFill,
  XCircleFill,
  ExclamationTriangleFill,
  InfoCircleFill,
} from "react-bootstrap-icons";

const config = {
  success: {
    icon: <CheckCircleFill className="text-success display-5" />,
    title: "Success 🎉",
  },
  error: {
    icon: <XCircleFill className="text-danger display-5" />,
    title: "Error ❌",
  },
  warning: {
    icon: <ExclamationTriangleFill className="text-warning display-5" />,
    title: "Warning ⚠️",
  },
  info: {
    icon: <InfoCircleFill className="text-primary display-5" />,
    title: "Info ℹ️",
  },
};

const AlertModal = ({ show, handleClose, type = "info", message }) => {
  const { icon, title } = config[type];

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      dialogClassName={`modal-${type}`}
    >
      <Modal.Body className="text-center p-4 custom-alert-modal">
        <div className="mb-3">{icon}</div>

        <h4 className="fw-bold">{title}</h4>
        <p className="text-muted mt-2">{message}</p>

        <Button
          variant="dark"
          onClick={handleClose}
          className="mt-3 w-100 rounded-pill"
        >
          OK
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default AlertModal;
