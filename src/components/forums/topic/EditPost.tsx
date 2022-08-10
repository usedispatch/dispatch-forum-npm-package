import * as _ from "lodash";
import { useState, ReactNode } from "react";
import { ForumPost } from "@usedispatch/client";

import { Edit } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  TransactionLink,
} from "../../common";
import { Notification } from "../Notification";
import { useForum } from "../../../contexts/DispatchProvider";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { ForumData } from "../../../utils/hooks";

interface EditPostProps {
  post: ForumPost;
  forumObject: DispatchForum;
  forumData: ForumData;
  update: () => Promise<void>;
}

export function EditPost(props: EditPostProps) {
  const { post, forumData, forumObject, update } = props;
  const { wallet } = useForum();
  const { permission } = forumObject;

  const [editPost, setEditPost] = useState<{
    show: boolean;
    body?: string;
    loading?: boolean;
  }>({ show: false, body: post.data.subj ?? "" });

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

  const editPostInfo = async () => {
    setEditPost({ ...editPost, loading: true });
    try {
      const tx = await forumObject.editForumPost(forumData.collectionId, post, {
        body: editPost.body!,
        subj: post.data.subj,
        meta: post.data.meta,
      });

      setEditPost({ show: false, loading: false });
      setNotificationContent({
        type: MessageType.success,
        content: (
          <div>
            <div>{`The ${post.isTopic ? "topic" : "post"} was edited`}</div>
            <TransactionLink transaction={tx} />
          </div>
        ),
      });
      await update();
    } catch (error: any) {
      setEditPost({ ...editPost, loading: false });
      if (error.code !== 4001) {
        setEditPost({ show: false });
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The ${post.isTopic ? "topic" : "post"} could not be edited`,
          collapsible: { header: "Error", content: error.message },
        });
      }
    }
  };

  if (!wallet.publicKey?.equals(post.poster)) {
    return null;
  }

  return (
    <div className="dsp- ">
      <div className="editPostContainer">
        {editPost.show && _.isNil(modalInfo) && (
          <PopUpModal
            id="edit-post"
            visible
            title={post.isTopic ? "Edit topic description" : "Edit post"}
            body={
              <div className="editPostBody">
                <div>
                  <label className="editPostLabel">
                    {post.isTopic ? "Topic description" : "Post content"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      post.isTopic
                        ? "New topic description"
                        : "New post content"
                    }
                    className="editPostInput"
                    value={editPost.body}
                    onChange={(e) =>
                      setEditPost({ ...editPost, body: e.target.value })
                    }
                  />
                </div>
              </div>
            }
            loading={editPost.loading}
            onClose={() => setEditPost({ show: false })}
            okButton={
              <button
                className="okButton"
                disabled={!editPost.body || editPost.body.length === 0}
                onClick={() => editPostInfo()}>
                Save
              </button>
            }
            cancelButton={
              <button
                className="cancelButton"
                onClick={() => setEditPost({ show: false })}>
                Cancel
              </button>
            }
          />
        )}
        {!_.isNil(modalInfo) && (
          <PopUpModal
            id="edit-post-info"
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
        <button
          className="editPostButton"
          disabled={!permission.readAndWrite}
          onClick={() => setEditPost({ show: true })}>
          <Edit /> Edit
        </button>
      </div>
    </div>
  );
}
