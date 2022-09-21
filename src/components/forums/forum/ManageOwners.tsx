import isNil from 'lodash/isNil';
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

import {
  newPublicKey,
  SCOPES,
  isSuccess,
  errorSummary,
  NOTIFICATION_BANNER_TIMEOUT,
  getIdentity
} from '@utils'
import { ForumData } from '@types';

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
    const ownerId = newPublicKey(manageOwners.newOwner);
    if (isSuccess(ownerId)) {
      const tx = await forumObject.addOwner(ownerId, forumData.collectionId);

      if (isSuccess(tx)) {
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
      } else {
        const error = tx;
        setManageOwners({
          ...manageOwners,
          newOwner: "",
          show: false,
        });
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The owner could not be added`,
          collapsible: { header: "Error", content: errorSummary(error) },
        });
      }
    } else {
      const error = ownerId;
      setManageOwners({
        ...manageOwners,
        newOwner: "",
        show: false,
      });
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The owner could not be added`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
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
        {isNil(modalInfo) && manageOwners.show && (
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
                    // TODO error checking on this newPublicKey
                    // call?
                    const pkey = newPublicKey(m);
                    if (isSuccess(pkey)) {
                      const identity = getIdentity(pkey);
                      return (
                        <li key={m} className="currentOwners">
                          <div className="iconContainer">
                            { identity ?
                              <img
                                src={identity.profilePicture.href}
                                style={{ borderRadius: '50%' }}
                              /> :
                              <Jdenticon value={m} alt="ownerId" />
                            }
                          </div>
                          { identity ? identity.displayName : m }
                        </li>
                      );
                    } else {
                      console.error(pkey);
                    }
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
        {!isNil(modalInfo) && (
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
