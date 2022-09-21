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

import { ForumData } from '../../../types/forumData';
import { useModerators } from '@hooks';
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";
import { isSuccess } from "../../../utils/loading";
import { errorSummary, isError } from "../../../utils/error";
import { newPublicKey } from "../../../utils/postbox/validateNewPublicKey";
import { SCOPES } from "../../../utils/permissions";
import { getIdentity } from "../../../utils/identity";

interface ManageModeratorsProps {
  forumData: ForumData;
}

export function ManageModerators(props: ManageModeratorsProps) {
  const { forumData } = props;
  const forumObject = useForum();
  const { permission } = forumObject;

  // here, moderators will always refer to the mods as fetched
  // from the server, which is an immutable value and can only be
  // changed by calling updateMods(). currentMods is the mutable
  // value that can be edited client-side
  const { moderators, update: updateMods } = useModerators(
    forumData.collectionId,
    forumObject
  );

  const [manageModerators, setManageModerators] = useState<{
    show: boolean;
    newModerator: string;
    addingNewModerator: boolean;
  }>({
    show: false,
    newModerator: "",
    addingNewModerator: false,
  });

  const resetInitialValues = () => {
    setManageModerators({
      show: false,
      newModerator: "",
      addingNewModerator: false,
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

  // Begin mutating operations
  const addModerator = async () => {
    // In order to add moderators, they must have been fetched successfully at least once.
    // This means that moderators must be a success type (indicating it was fetched successfully from server)
    if (!isSuccess(moderators)) {
      return;
    }

    setManageModerators({ ...manageModerators, addingNewModerator: true });
    const moderatorId = newPublicKey(manageModerators.newModerator);
    if (isError(moderatorId)) {
      const error = moderatorId;
      setManageModerators({ ...manageModerators, addingNewModerator: true });
      resetInitialValues();
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The moderator could not be added`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
      return;
    }
    const tx = await forumObject.addModerator(
      moderatorId,
      forumData.collectionId
    );
    if (isSuccess(tx)) {
      resetInitialValues();
      setNotificationContent({
        isHidden: false,
        content: (
          <>
            The moderator was added.
            <TransactionLink transaction={tx!} />
          </>
        ),
        type: MessageType.success,
      });
      setTimeout(
        () => setNotificationContent({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT
      );

      forumObject.connection.confirmTransaction(tx!).then(() => updateMods());
    } else {
      const error = tx;
      setManageModerators({ ...manageModerators, addingNewModerator: true });
      resetInitialValues();
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The moderator could not be added`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
    }
  };

  const moderatorsFetched = isSuccess(moderators);

  return (
    <div className="dsp- ">
      <div className="manageModeratorsContainer">
        <Notification
          hidden={notificationContent.isHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setNotificationContent({ isHidden: true })}
        />
        {isNil(modalInfo) && manageModerators.show && (
          <PopUpModal
            id="add-moderators"
            visible
            title={"Manage moderators"}
            body={
              <div className="manageModeratorsBody">
                {moderatorsFetched ? (
                  <>
                    <label className="manageModeratorsLabel">Add new</label>
                    <input
                      placeholder="Add moderator's wallet ID here"
                      className="manageModeratorsInput"
                      maxLength={800}
                      value={manageModerators.newModerator}
                      onChange={(e) =>
                        setManageModerators({
                          ...manageModerators,
                          newModerator: e.target.value,
                        })
                      }
                    />
                    <label className="manageModeratorsLabel">
                      Current moderators
                    </label>
                    <ul>
                      {moderators.map((pubkey) => {
                        const identity = getIdentity(pubkey);
                        const m = pubkey.toBase58();
                        return (
                          <li key={m} className="currentModerators">
                            <>
                              <div className="iconContainer">
                                {identity ? (
                                  <img
                                    src={identity.profilePicture.href}
                                    style={{ borderRadius: "50%" }}
                                  />
                                ) : (
                                  <Jdenticon value={m} alt="moderatorId" />
                                )}
                              </div>
                              {identity ? identity.displayName : m}
                            </>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <div className="emptyList">
                    Click to load the list of current moderators
                  </div>
                )}
              </div>
            }
            loading={manageModerators.addingNewModerator}
            okButton={
              moderatorsFetched ? (
                <button
                  className="okButton"
                  disabled={!manageModerators.newModerator.length}
                  onClick={() => addModerator()}>
                  Save
                </button>
              ) : (
                <button
                  className="okButton fetchModerators"
                  onClick={updateMods}>
                  Fetch moderators
                </button>
              )
            }
            onClose={() => resetInitialValues()}
          />
        )}
        {!isNil(modalInfo) && (
          <PopUpModal
            id="manage-moderators-info"
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
        <PermissionsGate scopes={[SCOPES.canEditMods]}>
          <button
            className="manageModeratorsButton"
            disabled={!permission.readAndWrite}
            onClick={() =>
              setManageModerators({ ...manageModerators, show: true })
            }>
            Manage moderators
          </button>
        </PermissionsGate>
      </div>
    </div>
  );
}
