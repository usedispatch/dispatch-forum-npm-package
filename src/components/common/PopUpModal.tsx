import _ from "lodash";
import { ReactNode, useRef } from "react";

import { Close, Success, Warning, Error, Info } from "../../assets";

import { CollapsibleProps, Collapsible } from "./Collapsible";
import { Spinner } from "./Spinner";

export enum MessageType {
  success = "success",
  warning = "warning",
  error = "error",
  info = "info",
}

export function getMessageTypeIcon(type?: MessageType): ReactNode {
  let result: ReactNode;

  switch (type) {
    case MessageType.success:
      result = <Success alt="success" />;
      break;
    case MessageType.warning:
      result = <Warning alt="warning" />;
      break;
    case MessageType.error:
      result = <Error alt="error" />;
      break;
    case MessageType.info:
      result = <Info alt="info" />;
      break;
    default:
      break;
  }

  return <div className="iconTypeContainer">{result}</div>;
}

interface PopUpModalProps {
  id: string;
  visible: boolean;
  title: string | ReactNode;
  body: ReactNode;
  collapsible?: CollapsibleProps;
  loading?: boolean;
  messageType?: MessageType;
  okButton?: ReactNode;
  cancelButton?: ReactNode;
  onClose?: () => void;
}

export const PopUpModal = (props: PopUpModalProps) => {
  const modalRef = useRef<HTMLInputElement>(null);
  if (modalRef.current) {
    modalRef.current.checked = props.visible;
  }

  const icon = getMessageTypeIcon(props.messageType);

  return (
    <div className="dsp-">
      <div className="popUpModal">
        <input
          type="checkbox"
          id={props.id}
          className="modal-toggle"
          ref={modalRef}
        />
        <div className="modalContainer">
          <div className="modalBox">
            <div className="modalTitle">
              <div className="titleTextIcon">
                {!_.isNil(props.messageType) && icon}
                {props.title}
              </div>
              {props.onClose && (
                <label
                  htmlFor={props.id}
                  className="modalClose"
                  onClick={props.onClose}
                >
                  <div className="closeIcon">
                    <Close />
                  </div>
                </label>
              )}
            </div>
            <div className={`modalBody ${props.loading ? "loading" : ""}`}>
              {props.body}
            </div>
            {props.collapsible ? (
              <div className="modalCollapsible">
                <Collapsible
                  content={props.collapsible.content}
                  header={props.collapsible.header}
                />
              </div>
            ) : undefined}
            {props.loading ? (
              <div className="modalLoading">
                <Spinner />
              </div>
            ) : (
              <div className="modalActionsContainer">
                <div className="cancelAction">{props.cancelButton}</div>
                <div className="acceptAction">{props.okButton}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
