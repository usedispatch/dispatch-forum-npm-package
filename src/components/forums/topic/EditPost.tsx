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
import { Notification } from "../../forums";

import { useForum } from "../../../contexts/DispatchProvider";

import { ForumData } from "../../../utils/hooks";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";

interface EditPostProps {
  post: ForumPost;
  forumData: ForumData;
  update: () => Promise<void>;
}

export function EditPost(props: EditPostProps) {
  const { post, forumData, update } = props;
  const forumObject = useForum();
  const { permission, wallet } = forumObject;

  const [editPost, setEditPost] = useState<{
    show: boolean;
    body: string;
    subj: string;
    loading?: boolean;
  }>({ show: false, body: post.data.body ?? "", subj: post.data.subj ?? "" });

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

  const resetToInitialValues = () =>
    setEditPost({
      show: false,
      body: post.data.body ?? "",
      subj: post.data.subj ?? "",
    });

  const editPostInfo = async () => {
    setEditPost({ ...editPost, loading: true });
    try {
      const tx = await forumObject.editForumPost(forumData.collectionId, post, {
        body: editPost.body,
        subj: editPost.subj,
        meta: post.data.meta,
      });

      await update();
      setEditPost({
        show: false,
        loading: false,
        body: editPost.body,
        subj: editPost.subj,
      });
      setNotificationContent({
        isHidden: false,
        type: MessageType.success,
        content: (
          <>
            The {` ${post.isTopic ? "topic" : "post"} `}was edited.
            <TransactionLink transaction={tx} />
          </>
        ),
      });
      setTimeout(
        () => setNotificationContent({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT
      );
    } catch (error: any) {
      setEditPost({ ...editPost, loading: false });
      if (error?.error?.code !== 4001) {
        resetToInitialValues();
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
        <Notification
          hidden={notificationContent.isHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setNotificationContent({ isHidden: true })}
        />
        {editPost.show && _.isNil(modalInfo) && (
          <PopUpModal
            id="edit-post"
            visible
            title={post.isTopic ? "Edit topic" : "Edit post"}
            body={
              <div className="editPostBody">
                {post.isTopic && (
                  <div>
                    <label className="editPostLabel">Topic title</label>
                    <input
                      type="text"
                      placeholder="New topic title"
                      className="editPostInput"
                      value={editPost.subj}
                      onChange={(e) =>
                        setEditPost({ ...editPost, subj: e.target.value })
                      }
                    />
                  </div>
                )}
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
            onClose={() => resetToInitialValues()}
            okButton={
              <button
                className="okButton"
                disabled={
                  post.isTopic
                    ? !editPost.subj || editPost.subj.length === 0
                    : !editPost.body || editPost.body.length === 0
                }
                onClick={() => editPostInfo()}>
                Save
              </button>
            }
            cancelButton={
              <button
                className="cancelButton"
                onClick={() => resetToInitialValues()}>
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
        <button
          className="editPostButton"
          disabled={!permission.readAndWrite}
          onClick={() => setEditPost({ ...editPost, show: true })}>
          <Edit /> Edit
        </button>
      </div>
    </div>
  );
}
