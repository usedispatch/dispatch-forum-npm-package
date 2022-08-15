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

interface ManageModeratorsProps {
  forumData: ForumData;
  update: () => Promise<void>;
}

export function ManageModerators(props: ManageModeratorsProps) {
  const { forumData, update } = props;
  const forumObject = useForum();
  const { permission } = forumObject;

  const [manageModerators, setManageModerators] = useState<{
    show: boolean;
    newModerator: string;
    currentModerators: string[];
    addingNewModerator: boolean;
  }>(() => {
    let moderators: string[] = [];
    if (isSuccess(forumData.moderators)) {
      moderators = forumData.moderators.map((pkey) => pkey.toBase58());
    } else {
      // TODO(andrew) show error here for missing owners
    }

    return {
      show: false,
      newModerator: "",
      currentModerators: moderators,
      addingNewModerator: false,
    };
  });

  const resetInitialValues = () => {
    let moderators: string[] = [];
    if (isSuccess(forumData.moderators)) {
      moderators = forumData.moderators.map((pkey) => pkey.toBase58());
    } else {
      // TODO(andrew) show error here for missing owners
    }

    setManageModerators({
      show: false,
      newModerator: "",
      currentModerators: moderators,
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

  const isOwner = useMemo(async () => {
    return forumObject.isOwner(forumData.collectionId);
  }, [forumObject]);

  const addModerator = async () => {
    setManageModerators({ ...manageModerators, addingNewModerator: true });
    try {
      const moderatorId = newPublicKey(manageModerators.newModerator);
      const tx = await forumObject.addModerator(
        moderatorId,
        forumData.collectionId
      );

      await update();
      setManageModerators({
        show: false,
        currentModerators: manageModerators.currentModerators.concat(
          manageModerators.newModerator
        ),
        newModerator: "",
        addingNewModerator: false,
      });
      setNotificationContent({
        isHidden: false,
        type: MessageType.success,
        content: (
          <>
            The moderator was added.
            <TransactionLink transaction={tx!} />
          </>
        ),
      });
      setTimeout(
        () => setNotificationContent({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT
      );
    } catch (error: any) {
      setManageModerators({ ...manageModerators, addingNewModerator: false });
      if (error.error?.code !== 4001) {
        setManageModerators({
          ...manageModerators,
          addingNewModerator: false,
          newModerator: "",
          show: false,
        });
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The moderators could not be added`,
          collapsible: { header: "Error", content: error.message },
        });
      }
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="dsp- ">
      <div className="manageModeratorsContainer">
        <Notification
          hidden={notificationContent.isHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setNotificationContent({ isHidden: true })}
        />
        {_.isNil(modalInfo) && manageModerators.show && (
          <PopUpModal
            id="add-moderators"
            visible
            title={"Manage moderators"}
            body={
              <div className="addModeratorsBody">
                <label className="addModeratorsLabel">Add new</label>
                <input
                  placeholder="Add moderator's wallet ID here"
                  className="addModeratorsInput"
                  maxLength={800}
                  value={manageModerators.newModerator}
                  onChange={(e) =>
                    setManageModerators({
                      ...manageModerators,
                      newModerator: e.target.value,
                    })
                  }
                />
                <label className="addModeratorsLabel">Current moderators</label>
                <ul>
                  {manageModerators.currentModerators.map((m) => {
                    return (
                      <li key={m} className="currentModerators">
                        <div className="iconContainer">
                          <Jdenticon value={m} alt="moderatorId" />
                        </div>
                        {m}
                      </li>
                    );
                  })}
                </ul>
              </div>
            }
            loading={manageModerators.addingNewModerator}
            okButton={
              <button
                className="okButton"
                disabled={!manageModerators.newModerator.length}
                onClick={() => addModerator()}>
                Save
              </button>
            }
            onClose={() => resetInitialValues()}
          />
        )}
        {!_.isNil(modalInfo) && (
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
        <PermissionsGate scopes={[SCOPES.canAddOwner]}>
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
