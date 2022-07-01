import * as _ from "lodash";
import { ReactNode, useEffect, useMemo, useState } from "react";
import Jdenticon from "react-jdenticon";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Trash } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Spinner,
} from "./../../common";
import { PostReplies } from "../topic/PostReplies";
import { Votes } from "../../../components/forums";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import permission from "../../../utils/postbox/permission.json";
import { UserRoleType } from "../../../utils/postbox/userRole";

interface PostContentProps {
  forum: DispatchForum;
  collectionId: web3.PublicKey;
  post: ForumPost;
  deletePermission: boolean;
  userRole: UserRoleType;
  onDeletePost: (post: ForumPost) => Promise<string>;
}

export function PostContent(props: PostContentProps) {
  const { collectionId, deletePermission, forum, userRole, onDeletePost } =
    props;

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
    collapsible?: CollapsibleProps;
  } | null>(null);

  const post = useMemo(() => props.post, [props.post]);

  const updateVotes = (upVoted: boolean) => {
    if (upVoted) {
      post.upVotes = post.upVotes + 1;
    } else {
      post.downVotes = post.downVotes + 1;
    }
  };

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
        collapsible: { header: "Error", content: error },
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
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The reply could not be sent`,
        collapsible: { header: "Error", content: error },
      });
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
        collapsible: { header: "Error", content: error },
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
      <div className="postContentContainer">
        {_.isNull(modalInfo) && showDeleteConfirmation && (
          <PopUpModal
            id="post-delete-confirmation"
            visible
            title="Are you sure you want to delete this post?"
            body={
              "This is permanent and you won’t be able to retrieve this comment again. Upvotes and downvotes will go too."
            }
            loading={deleting}
            okButton={
              !deleting && (
                <a
                  className="acceptDeletePostButton"
                  onClick={() => onDelete(post)}>
                  Accept
                </a>
              )
            }
            cancelButton={
              !deleting && (
                <div
                  className="cancelDeletePostButton"
                  onClick={() => setShowDeleteConfirmation(false)}>
                  Cancel
                </div>
              )
            }
          />
        )}
        {!_.isNull(modalInfo) && (
          <PopUpModal
            id="post-info"
            visible
            title={modalInfo?.title}
            messageType={modalInfo?.type}
            body={modalInfo?.body}
            okButton={
              <a className="okInfoButton" onClick={() => setModalInfo(null)}>
                OK
              </a>
            }
          />
        )}
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="postHeader">
              <div className="posterId">
                <div className="icon">
                  <Jdenticon value={post?.poster.toBase58()} alt="posterID" />
                </div>
                <div className="walletId">{post.poster.toBase58()}</div>
              </div>
              <div className="postedAt">Posted at: {postedAt}</div>
            </div>
            <div className="postBody">{post?.data.body}</div>
            <div className="actionsContainer">
              {deletePermission && (
                <button
                  className="deleteButton"
                  disabled={!permission.readAndWrite}
                  onClick={() => setShowDeleteConfirmation(true)}>
                  <Trash />
                </button>
              )}
              <button
                className="replyButton"
                disabled={!permission.readAndWrite}
                onClick={() => setShowReplyBox(true)}>
                Reply
              </button>
              <Votes
                post={post}
                onDownVotePost={() =>
                  forum.voteDownForumPost(post, collectionId)
                }
                onUpVotePost={() => forum.voteUpForumPost(post, collectionId)}
                updateVotes={(upVoted) => updateVotes(upVoted)}
              />
            </div>
            <div
              className="repliesSection"
              hidden={replies.length === 0 && !showReplyBox}>
              <div className="repliesBox">
                <PostReplies
                  replies={replies}
                  userRole={userRole}
                  onDeletePost={onDeletePost}
                  onDownVotePost={(reply) =>
                    forum.voteDownForumPost(reply, collectionId)
                  }
                  onUpVotePost={(reply) =>
                    forum.voteUpForumPost(reply, collectionId)
                  }
                  onReplyClick={() => setShowReplyBox(true)}
                />
              </div>
              {showReplyBox &&
                (sendingReply ? (
                  <Spinner />
                ) : (
                  <form onSubmit={onReplyToPost} className="replyForm">
                    <textarea
                      placeholder="Type your reply here"
                      className="replyTextArea"
                      maxLength={800}
                      value={reply}
                      required
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <div className="buttonsContainer">
                      <button
                        className="cancelReplyButton"
                        onClick={() => setShowReplyBox(false)}>
                        Cancel
                      </button>
                      <button className="postReplyButton" type="submit">
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
