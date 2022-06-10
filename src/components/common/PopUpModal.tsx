import { ReactNode, useRef } from "react";
import Image from "../../utils/image";

import { close, success, warning, errorIcon, infoIcon } from "../../assets";

import { Spinner } from "./Spinner";

export enum MessageType {
  success,
  warning,
  error,
  info,
}

function getMessageTypeIcon(type?: MessageType): ReactNode {
  let result = null;

  switch (type) {
    case MessageType.success:
      //result = <Image src={success} width={32} height={32} alt="success" />;
      break;
    case MessageType.warning:
      //result = <Image src={warning} width={32} height={32} alt="warning" />;
      break;
    case MessageType.error:
      //result = <Image src={errorIcon} width={32} height={32} alt="error" />;
      break;
    case MessageType.info:
      //result = <Image src={infoIcon} width={32} height={32} alt="info" />;
      break;
    default:
      break;
  }

  return <div className="flex mr-2">{result}</div>;
}

interface PopUpModalProps {
  id: string;
  visible: boolean;
  title: string | ReactNode;
  body: ReactNode;
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
    <>
      <input
        type="checkbox"
        id={props.id}
        className="modal-toggle"
        ref={modalRef}
      ></input>
      <div className="modal bg-gray-600 bg-opacity-50">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-lg flex items-center">
            {icon}
            {props.title}
          </h3>
          {props.onClose && (
            <label
              htmlFor={props.id}
              className="btn btn-sm absolute right-2 top-2 border-none"
              onClick={props.onClose}
            >
              <Image src={close} width={16} height={16} alt="close" />
            </label>
          )}
          <div className="py-4 flex">{props.body}</div>
          {props.loading ? (
            <div className="p-6">
              <Spinner />
            </div>
          ) : (
            <div className="flex justify-end">
              <div className="modal-action mr-2">{props.cancelButton}</div>
              <div className="modal-action">{props.okButton}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
