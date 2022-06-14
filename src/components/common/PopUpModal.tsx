import _ from "lodash";
import { ReactNode, useRef } from "react";

import { Close, Success, Warning, Error, Info } from "../../assets";

import { Spinner } from "./Spinner";

export enum MessageType {
  success,
  warning,
  error,
  info,
}

function getMessageTypeIcon(type?: MessageType): ReactNode {
  let result : ReactNode;

  switch (type) {
    case MessageType.success:
      result = 
          <Success alt="success"/>
      break;
    case MessageType.warning:
      result = <Warning alt="warning"/>
      break;
    case MessageType.error:
      result = 
        <Error alt="error"/>
      break;
    case MessageType.info:
      result = <Info alt="info"/>
      break;
    default:
      break;
  }

  return <div className="flex mr-2 h-8 w-8">{result}</div>;
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
          <div className="font-bold text-lg flex items-center">
            {!_.isNil(props.messageType) && icon}
            {props.title}
          </div>
          {props.onClose && (
            <label
              htmlFor={props.id}
              className="btn btn-sm absolute right-2 top-2 border-none"
              onClick={props.onClose}
            >
              <div className=" h-4 w-4">
                <Close />
              </div>
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
