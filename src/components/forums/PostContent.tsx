import * as _ from "lodash";
import { ReactNode, useEffect, useState } from "react";
import Jdenticon from "react-jdenticon";
import * as web3 from "@solana/web3.js";  
import { ForumPost } from "@usedispatch/client";

import { Trash } from "../../assets";
import { MessageType, PopUpModal, Spinner } from "./../common";
import { PostReplies } from "../forums";

import { DispatchForum } from "../../utils/postbox/postboxWrapper";
import { UserRoleType } from "../../utils/postbox/userRole";

interface PostContentProps {
  forum: DispatchForum;
  collectionId: web3.PublicKey;
  post: ForumPost;
  deletePermission: boolean;
  userRole: UserRoleType;
  onDeletePost: (post: ForumPost) => Promise<string>;
}

export function PostContent(props: PostContentProps) {
  const {
    collectionId,
    deletePermission,
    forum,
    post,
    userRole,
    onDeletePost,
  } = props;

  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<ForumPost[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
  } | null>(null);

  const getReplies = async () => {
    setLoading(true);
    try {
      const data = await forum.getReplies(post, collectionId);
      setReplies(data ?? []);
      setLoading(false);
    } catch (error) {
      setReplies([]);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The replies could not be loaded`,
      });
      setLoading(false);
    }
  };

  const onReplyToPost = async () => {
    setSendingReply(true);
    try {
      await forum.replyToForumPost(post, collectionId, {
        body: reply,
      });
      getReplies();
      setSendingReply(false);
      setShowReplyBox(false);
      setReply("");
    } catch (error) {
      setSendingReply(false);
    }
  };

  const onDelete = async (post: ForumPost) => {
    setDeleting(true);
    try {
      await onDeletePost(post);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: `The post was deleted`,
      });
      setShowDeleteConfirmation(false);
      setDeleting(false);
    } catch (error) {
      setShowDeleteConfirmation(false);
      setDeleting(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The post could not be deleted`,
      });
    }
  };

  useEffect(() => {
    if (!_.isNil(post) && !_.isNil(collectionId)) {
      getReplies();
    } else {
      setLoading(false);
    }
  }, [post, collectionId]);

  const postedAt = `${post.data.ts.toLocaleDateString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })} at ${post.data.ts.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
  })}`;

  return (
    <>
      <div className="border-t border-gray-400" />
      <div className="font-raleway h-auto my-6 mx-2">
        <PopUpModal
          id="post-delete-confirmation"
          visible={_.isNull(modalInfo) && showDeleteConfirmation}
          title="Are you sure you want to delete this post?"
          body={
            deleting ? (
              <div className="flex items-center justify-center pt-6 m-auto">
                <Spinner />
              </div>
            ) : (
              "This is permanent and you won’t be able to retrieve this comment again. Upvotes and downvotes will go too."
            )
          }
          okButton={
            !deleting && (
              <a
                className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white border-2"
                onClick={() => onDelete(post)}
              >
                Accept
              </a>
            )
          }
          cancelButton={
            !deleting && (
              <div
                className="btn btn-secondary border-2 hover:opacity-75 hover:bg-gray-200"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Cancel
              </div>
            )
          }
        />
        <PopUpModal
          id="post-info"
          visible={!_.isNull(modalInfo)}
          title={modalInfo?.title}
          messageType={modalInfo?.type}
          body={modalInfo?.body}
          okButton={
            <a
              className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white border-2"
              onClick={() => setModalInfo(null)}
            >
              OK
            </a>
          }
        />
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="flex items-start justify-between pb-4">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <div className="h-7 w-7 mr-1">
                    <Jdenticon
                      className="h-7 w-7"
                      value={post?.poster.toBase58()}
                      alt="posterID"
                    />
                  </div>
                  <div className="text-sm font-normal">
                    {post.poster.toBase58()}
                  </div>
                </div>
              </div>
              <div className="text-xs font-light">Posted at: {postedAt}</div>
            </div>
            <div className="text-sm mb-3">{post?.data.body}</div>
            <div className="flex items-center">
              {deletePermission && (
                <button
                  className="mr-1"
                  onClick={() => setShowDeleteConfirmation(true)}
                >
                  <Trash/>
                </button>
              )}
              <button
                className="normal-case border border-gray-800 rounded-full text-xs flex items-center h-6 max-h-6 p-2 mr-2"
                onClick={() => setShowReplyBox(true)}
              >
                Reply
              </button>
            </div>
            <div
              className="mt-4 ml-6 pt-[2px] pl-2 border-l border-gray-400"
              hidden={replies.length === 0 && !showReplyBox}
            >
              <div className="pl-4">
                <PostReplies
                  replies={replies}
                  userRole={userRole}
                  onDeletePost={onDeletePost}
                  onReplyClick={() => setShowReplyBox(true)}
                />
              </div>
              {showReplyBox &&
                (sendingReply ? (
                  <Spinner />
                ) : (
                  <form
                    onSubmit={onReplyToPost}
                    className="flex flex-col items-end mt-6 mb-14 pl-4"
                  >
                    <textarea
                      placeholder="Type your reply here"
                      className="input input-bordered h-36 w-full mt-1 border-gray-400 placeholder-gray-400 rounded-2xl"
                      maxLength={800}
                      value={reply}
                      required
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <div className="mt-6">
                      <button
                        className="btn btn-secondary bg-white text-gray-800 hover:bg-white-200 px-10 mr-3"
                        onClick={() => setShowReplyBox(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white px-10"
                        type="submit"
                      >
                        Reply
                      </button>
                    </div>
                  </form>
                ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
