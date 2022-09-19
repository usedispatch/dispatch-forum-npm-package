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
import { isSuccess } from "../../../utils/loading";
import { errorSummary } from "../../../utils/error";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";

interface EditPostProps {
  post: ForumPost;
  forumData: ForumData;
  showDividers: { leftDivider: boolean; rightDivider: boolean };
  editPostLocal: (post: ForumPost, newBody: string, newSubj?: string) => void;
  update: () => Promise<void>;
}

export function EditPost(props: EditPostProps) {
  const { post, forumData, update, showDividers, editPostLocal } = props;
  const forumObject = useForum();
  const { permission, wallet } = forumObject;

  const [editPost, setEditPost] = useState<{
    show: boolean;
    body: string;
    subj: string;
    loading?: boolean;
  }>({ show: false, body: post.data.body ?? "", subj: post.data.subj ?? "" });
  const [bodySize, setBodySize] = useState(
    new Buffer(post.data.body, "utf-8").byteLength
  );
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

  const resetToInitialValues = () => {
    setEditPost({
      show: false,
      body: post.data.body ?? "",
      subj: post.data.subj ?? "",
    });
    setBodySize(new Buffer(post.data.body, "utf-8").byteLength);
  };

  const editPostInfo = async () => {
    setEditPost({ ...editPost, loading: true });
    const tx = await forumObject.editForumPost(forumData.collectionId, post, {
      body: editPost.body,
      subj: editPost.subj,
      meta: post.data.meta,
    });
    if (isSuccess(tx)) {

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

      // Edit the local post
      editPostLocal(post, editPost.body, editPost.subj);

      // When the transaction is confirmed, update for real
      forumObject.connection
        .confirmTransaction(tx)
        .then(() => update());

      setTimeout(
        () => setNotificationContent({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT
      );
    } else {
      setEditPost({ ...editPost, loading: false });
      const error = tx;
      resetToInitialValues();
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The ${post.isTopic ? "topic" : "post"} could not be edited`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
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
                  <textarea
                    maxLength={800}
                    placeholder={
                      post.isTopic
                        ? "New topic description"
                        : "New post content"
                    }
                    className="editPostInput description"
                    value={editPost.body}
                    onChange={(e) => {
                      setEditPost({ ...editPost, body: e.target.value });
                      setBodySize(new Buffer(e.target.value).byteLength);
                    }}
                  />
                  <div className="textSize"> {bodySize}/800 </div>
                </div>
              </div>
            }
            loading={editPost.loading}
            onClose={() => resetToInitialValues()}
            okButton={
              <button
                className="okButton"
                disabled={
                  (post.isTopic
                    ? editPost.subj.length === 0
                    : editPost.body.length === 0) || bodySize > 800
                }
                onClick={() => editPostInfo()}>
                Save
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
        {showDividers.leftDivider && <div className="actionDivider" />}
        <button
          className="editPostButton"
          disabled={!permission.readAndWrite}
          onClick={() => setEditPost({ ...editPost, show: true })}>
          <Edit /> Edit
        </button>
        {showDividers.rightDivider && <div className="actionDivider" />}
      </div>
    </div>
  );
}
