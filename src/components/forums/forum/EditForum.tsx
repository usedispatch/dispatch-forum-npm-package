import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";

import { Edit } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  TransactionLink,
} from "../../common";
import { Notification } from "../Notification";
import { useForum } from "../../../contexts/DispatchProvider";

import { ForumData } from "../../../utils/hooks";

interface EditForumProps {
  forumData: ForumData;
  update: () => Promise<void>;
}

export function EditForum(props: EditForumProps) {
  const { forumData, update } = props;
  const forumObject = useForum();
  const { permission } = forumObject;

  const [editForum, setEditForum] = useState<{
    show: boolean;
    title?: string;
    description?: string;
    loading?: boolean;
  }>({ show: false });

  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const [notificationContent, setNotificationContent] = useState<{
    content: string | ReactNode;
    type: MessageType;
  }>();
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const isOwner = useMemo(async () => {
    return forumObject.isModerator(forumData.collectionId);
  }, [forumObject]);

  const editForumInfo = async () => {
    setEditForum({ ...editForum, loading: true });
    try {
      const desc = { title: editForum.title!, desc: editForum.description! };

      const tx = await forumObject.setDescription(forumData.collectionId, desc);
      await update();

      setEditForum({ show: false });
      setNotificationContent({
        type: MessageType.success,
        content: (
          <div>
            <div>The forum was edited</div>
            <TransactionLink transaction={tx} />
          </div>
        ),
      });
    } catch (error: any) {
      setEditForum({ ...editForum, loading: false });
      if (error.code !== 4001) {
        setEditForum({ show: false });
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The forum could not be edited`,
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
      <div className="editForumContainer">
        {editForum.show && _.isNil(modalInfo) && (
          <PopUpModal
            id="edit-forum"
            visible
            title="Edit forum"
            body={
              <div className="editForumBody">
                <div>
                  <label className="editForumLabel">Forum title</label>
                  <input
                    type="text"
                    placeholder="New forum title"
                    className="editForumInput"
                    value={editForum.title}
                    onChange={(e) =>
                      setEditForum({ ...editForum, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="editForumLabel">Forum description</label>
                  <input
                    type="text"
                    placeholder="New forum description"
                    className="editForumInput"
                    value={editForum.description}
                    onChange={(e) =>
                      setEditForum({
                        ...editForum,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            }
            loading={editForum.loading}
            onClose={() => setEditForum({ show: false })}
            okButton={
              <button
                className="okButton"
                disabled={
                  !(
                    editForum.description &&
                    editForum.description.length > 0 &&
                    editForum.title &&
                    editForum.title.length > 0
                  )
                }
                onClick={() => editForumInfo()}>
                Save
              </button>
            }
            cancelButton={
              <button
                className="cancelButton"
                onClick={() => setEditForum({ show: false })}>
                Cancel
              </button>
            }
          />
        )}
        {!_.isNil(modalInfo) && (
          <PopUpModal
            id="edit-forum-info"
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
        <Notification
          hidden={isNotificationHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setIsNotificationHidden(true)}
        />
        <div className="actionDivider" />
        <button
          className="editForumButton"
          disabled={!permission.readAndWrite}
          onClick={() => setEditForum({ show: true })}>
          <Edit /> Edit forum
        </button>
      </div>
    </div>
  );
}
