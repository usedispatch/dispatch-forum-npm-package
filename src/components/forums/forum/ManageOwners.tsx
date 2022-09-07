import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";
import Jdenticon from "react-jdenticon";

import {
  CollapsibleProps,
  MessageType,
  PermissionsGate,
  PopUpModal,
  TransactionLink,
} from "../../common";
import { Notification } from "..";
import { useForum } from "../../../contexts/DispatchProvider";

import { ForumData } from "../../../utils/hooks";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";
import { isSuccess } from "../../../utils/loading";
import { newPublicKey } from "../../../utils/postbox/validateNewPublicKey";
import { SCOPES } from "../../../utils/permissions";

interface ManageOwnersProps {
  forumData: ForumData;
}

export function ManageOwners(props: ManageOwnersProps) {
  const { forumData } = props;
  const forumObject = useForum();
  const { permission } = forumObject;

  const [manageOwners, setManageOwners] = useState<{
    show: boolean;
    newOwner: string;
    currentOwners: string[];
    addingNewOwner: boolean;
  }>(() => {
    let owners: string[] = [];
    if (isSuccess(forumData.owners)) {
      owners = forumData.owners.map((pkey) => pkey.toBase58());
    } else {
      // TODO(andrew) show error here for missing owners
    }

    return {
      show: false,
      newOwner: "",
      currentOwners: owners,
      addingNewOwner: false,
    };
  });

  const resetInitialValues = () => {
    let owners: string[] = [];
    if (isSuccess(forumData.owners)) {
      owners = forumData.owners.map((pkey) => pkey.toBase58());
    } else {
      // TODO(andrew) show error here for missing owners
    }

    setManageOwners({
      show: false,
      newOwner: "",
      currentOwners: owners,
      addingNewOwner: false,
    });
  };

  const [notificationContent, setNotificationContent] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const isOwner = useMemo(async () => {
    return forumObject.isOwner(forumData.collectionId);
  }, [forumObject]);

  const addOwner = async () => {
    setManageOwners({ ...manageOwners, addingNewOwner: true });
    try {
      const ownerId = newPublicKey(manageOwners.newOwner);
      const tx = await forumObject.addOwner(ownerId, forumData.collectionId);

      setManageOwners({
        show: false,
        currentOwners: manageOwners.currentOwners.concat(manageOwners.newOwner),
        newOwner: "",
        addingNewOwner: false,
      });
      setNotificationContent({
        isHidden: false,
        content: (
          <>
            The owner was added.
            <TransactionLink transaction={tx!} />
          </>
        ),
        type: MessageType.success,
      });
      setTimeout(
        () => setNotificationContent({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT
      );
    } catch (error: any) {
      setManageOwners({ ...manageOwners, addingNewOwner: false });
      if (error.error?.code !== 4001) {
        setManageOwners({
          ...manageOwners,
          newOwner: "",
          show: false,
        });
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The owner could not be added`,
          collapsible: { header: "Error", content: error },
        });
      }
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="dsp- ">
      <div className="manageOwnersContainer">
        <Notification
          hidden={notificationContent.isHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setNotificationContent({ isHidden: true })}
        />
        {_.isNil(modalInfo) && manageOwners.show && (
          <PopUpModal
            id="add-owners"
            visible
            title={"Manage owners"}
            body={
              <div className="manageOwnersBody">
                <label className="manageOwnersLabel">Add new</label>
                <input
                  placeholder="Add owners's wallet ID here"
                  className="manageOwnersInput"
                  maxLength={800}
                  value={manageOwners.newOwner}
                  onChange={(e) =>
                    setManageOwners({
                      ...manageOwners,
                      newOwner: e.target.value,
                    })
                  }
                />
                <label className="manageOwnersLabel">Current owners</label>
                <ul>
                  {manageOwners.currentOwners.map((m) => {
                    return (
                      <li key={m} className="currentOwners">
                        <div className="iconContainer">
                          <Jdenticon value={m} alt="ownerId" />
                        </div>
                        {m}
                      </li>
                    );
                  })}
                </ul>
              </div>
            }
            loading={manageOwners.addingNewOwner}
            okButton={
              <button
                className="okButton"
                disabled={!manageOwners.newOwner.length}
                onClick={() => addOwner()}>
                Save
              </button>
            }
            onClose={() => resetInitialValues()}
          />
        )}
        {!_.isNil(modalInfo) && (
          <PopUpModal
            id="manage-owners-info"
            visible
            title={modalInfo.title}
            messageType={modalInfo.type}
            body={modalInfo.body}
            collapsible={modalInfo.collapsible}
            okButton={
              <a className="okButton" onClick={() => setModalInfo(null)}>
                OK
              </a>
            }
          />
        )}
        <PermissionsGate scopes={[SCOPES.canAddOwner]}>
          <button
            className="manageOwnersButton"
            disabled={!permission.readAndWrite}
            onClick={() => setManageOwners({ ...manageOwners, show: true })}>
            Manage owners
          </button>
        </PermissionsGate>
      </div>
    </div>
  );
}
