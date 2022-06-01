import { ReactNode, useState } from "react";
import Image from "next/image";
import { MessageAccount } from "@usedispatch/client";

import trash from "assets/trash_icon.svg";
import { MessageType, PopUpModal } from "components/common/PopUpModal";
import { useMailbox } from "contexts/MailboxProvider";

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
    <>
      <PopUpModal
        id="delete-error"
        visible={modalInfo != null}
        title={modalInfo?.title}
        messageType={modalInfo?.type}
        body={<div className="text-base">{modalInfo?.body}</div>}
        okButton={
          <div
            className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white border-2"
            onClick={() => setModalInfo(null)}
          >
            OK
          </div>
        }
      />
      <PopUpModal
        id="delete-confirmation"
        visible={showConfirm && modalInfo == null}
        title="Are you sure you want to delete this message?"
        messageType={modalInfo?.type}
        loading={loadingDelete}
        body={
          <div className="text-base">
            This will be permanent and you won’t be able to access it again.
          </div>
        }
        okButton={
          <div
            className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white border-2"
            onClick={deleteMessage}
          >
            Accept
          </div>
        }
        cancelButton={
          <div
            className="btn btn-secondary border-2 hover:opacity-75 hover:bg-gray-200"
            onClick={() => {
              setModalInfo(null);
              setShowConfirm(false);
            }}
          >
            Cancel
          </div>
        }
      />
      <div className="flex items-center justify-start cursor-pointer">
        <Image
          src={trash}
          height={props.height ?? 20}
          width={props.width ?? 20}
          alt="delete"
          onClick={() => setShowConfirm(true)}
        />
      </div>
    </>
  );
};
