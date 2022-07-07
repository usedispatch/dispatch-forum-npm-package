import * as _ from "lodash";
import { ReactNode, useState } from "react";
import { MessageAccount } from "@usedispatch/client";

import { Trash } from "../../assets";
import { MessageType, PopUpModal } from "./PopUpModal";
import { useMailbox } from "../../contexts/MailboxProvider";

interface DeleteMesssageButtonProps {
  message: MessageAccount;
  onDelete: () => void;
  height?: number;
  width?: number;
}

export const DeleteMesssageButton = (props: DeleteMesssageButtonProps) => {
  const mailbox = useMailbox();
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body: string;
  } | null>(null);

  const deleteMessage = () => {
    setLoadingDelete(true);
    mailbox
      ?.deleteMessage(props.message)
      .then(() => {
        props.onDelete();
        setLoadingDelete(false);
        setShowConfirm(false);
      })
      .catch(() => {
        setLoadingDelete(false);
        setShowConfirm(false);
        setModalInfo({
          title: "Something went wrong",
          type: MessageType.error,
          body: `The message '${props.message.data.body.substring(0, 6)}${
            props.message.data.body.length > 6 ? "..." : ""
          }' was not deleted. Try again`,
        });
      });
  };

  return (
    <div className="deleteMessageButton">
      {!_.isNil(modalInfo) && (
        <PopUpModal
          id="delete-error"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={<div className="text-base">{modalInfo.body}</div>}
          okButton={
            <div className="okButton" onClick={() => setModalInfo(null)}>
              OK
            </div>
          }
        />
      )}
      {showConfirm && !_.isNil(modalInfo) && (
        <PopUpModal
          id="delete-confirmation"
          visible
          title="Are you sure you want to delete this message?"
          messageType={modalInfo?.type}
          loading={loadingDelete}
          body={
            <div className="text-base">
              This will be permanent and you won’t be able to access it again.
            </div>
          }
          okButton={
            <div className="okButton" onClick={deleteMessage}>
              Confirm
            </div>
          }
          cancelButton={
            <div
              className="cancelButton"
              onClick={() => {
                setModalInfo(null);
                setShowConfirm(false);
              }}>
              Cancel
            </div>
          }
        />
      )}
      <div className="trashIconContainer">
        {/* <Image
          src={trash}
          height={props.height ?? 20}
          width={props.width ?? 20}
          alt="delete"
          onClick={() => setShowConfirm(true)}
        /> */}
        <Trash />
      </div>
    </div>
  );
};
