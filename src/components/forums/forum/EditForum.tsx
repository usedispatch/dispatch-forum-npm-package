import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";

import { Edit } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  TransactionLink,
} from "../../common";
import { Notification } from "../../forums";
import { useForum } from "../../../contexts/DispatchProvider";

import { ForumData } from "../../../utils/hooks";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";

interface EditForumProps {
  forumData: ForumData;
  update: () => Promise<void>;
}

export function EditForum(props: EditForumProps) {
  const { forumData, update } = props;
  const forumObject = useForum();
  const { permission } = forumObject;
  const [bodySize, setBodySize] = useState(
    new Buffer(forumData.description.desc, "utf-8").byteLength
  );
  const [editForum, setEditForum] = useState<{
    show: boolean;
    title: string;
    description: string;
    loading?: boolean;
  }>({
    show: false,
    title: forumData.description.title,
    description: forumData.description.desc,
  });

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

  const editForumInfo = async () => {
    setEditForum({ ...editForum, loading: true });
    try {
      const desc = { title: editForum.title!, desc: editForum.description! };

      const tx = await forumObject.setDescription(forumData.collectionId, desc);

      await update();
      setBodySize(0);
      setEditForum({ show: false, title: desc.title, description: desc.desc });
      setNotificationContent({
        isHidden: false,
        type: MessageType.success,
        content: (
          <>
            The forum was edited.
            <TransactionLink transaction={tx} />
          </>
        ),
      });
      setTimeout(
        () => setNotificationContent({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT
      );
    } catch (error: any) {
      setEditForum({ ...editForum, loading: false });
      if (error.code !== 4001) {
        setEditForum({
          show: false,
          title: forumData.description.title,
          description: forumData.description.desc,
        });
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
        <Notification
          hidden={notificationContent.isHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setNotificationContent({ isHidden: true })}
        />
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
                    onChange={(e) => {
                      setEditForum({
                        ...editForum,
                        description: e.target.value,
                      });
                      setBodySize(
                        new Buffer(e.target.value, "utf-8").byteLength
                      );
                    }}
                  />
                  <div> {bodySize}/800 </div>
                </div>
              </div>
            }
            loading={editForum.loading}
            onClose={() =>
              setEditForum({
                show: false,
                title: forumData.description.title,
                description: forumData.description.desc,
              })
            }
            okButton={
              <button
                className="okButton"
                disabled={
                  !(
                    editForum.description.length > 0 &&
                    editForum.title.length > 0
                  ) || bodySize > 800
                }
                onClick={() => editForumInfo()}
              >
                Save
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
        <div className="actionDivider" />
        <button
          className="editForumButton"
          disabled={!permission.readAndWrite}
          onClick={() => setEditForum({ ...editForum, show: true })}
        >
          <Edit /> Edit forum
        </button>
      </div>
    </div>
  );
}
