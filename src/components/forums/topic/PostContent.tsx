import {isNil, isNull} from "../../../utils/misc";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Jdenticon from "react-jdenticon";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Award, Success, Trash } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PermissionsGate,
  PopUpModal,
  Spinner,
  TransactionLink,
} from "./../../common";
import { PostReplies } from "../topic/PostReplies";
import { Votes, Notification } from "../../../components/forums";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";
import { SCOPES, UserRoleType } from "../../../utils/permissions";
import { GiveAward } from "./GiveAward";

interface PostContentProps {
  forum: DispatchForum;
  collectionId: web3.PublicKey;
  post: ForumPost;
  userRole: UserRoleType;
  onDeletePost: (tx: string) => Promise<void>;
}

export function PostContent(props: PostContentProps) {
  const { collectionId, forum, userRole, onDeletePost } = props;

  const permission = forum.permission;

  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<ForumPost[]>([]);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [postToDelete, setPostToDelete] = useState(props.post);
  const [deleting, setDeleting] = useState(false);

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [showGiveAward, setShowGiveAward] = useState(false);
  const [postToAward, setPostToAward] = useState<ForumPost>();

  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const [notificationContent, setNotificationContent] = useState<
    string | ReactNode
  >("");

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
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
    } catch (error: any) {
      setReplies([]);
      console.log(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The replies could not be loaded`,
        collapsible: { header: "Error", content: error.message },
      });
      setLoading(false);
    }
  };

  const onReplyToPost = async () => {
    setSendingReply(true);
    try {
      const tx = await forum.replyToForumPost(post, collectionId, {
        body: reply,
      });
      getReplies();
      setSendingReply(false);
      setShowReplyBox(false);
      setReply("");
      setIsNotificationHidden(false);
      setNotificationContent(
        <>
          <Success />
          Replied successfully.
          <TransactionLink transaction={tx!} />
        </>
      );
      setTimeout(
        () => setIsNotificationHidden(true),
        NOTIFICATION_BANNER_TIMEOUT
      );
    } catch (error: any) {
      console.log(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The reply could not be sent`,
        collapsible: { header: "Error", content: error.message },
      });
      setSendingReply(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      const tx = await forum.deleteForumPost(
        postToDelete,
        collectionId,
        userRole === UserRoleType.Moderator
      );
      onDeletePost(tx);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: `The post was deleted`,
      });
      setShowDeleteConfirmation(false);
      setDeleting(false);
    } catch (error: any) {
      setShowDeleteConfirmation(false);
      setDeleting(false);
      let modalInfoError;
      if (error.code === 4001) {
        modalInfoError = {
          title: "The post could not be deleted",
          type: MessageType.error,
          body: `The user cancelled the request`,
        };
      } else {
        modalInfoError = {
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The post could not be deleted`,
          collapsible: { header: "Error", content: error.message },
        };
      }
      setModalInfo(modalInfoError);
    }
  };

  useEffect(() => {
    if (!isNil(post) && !isNil(collectionId)) {
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
        {isNull(modalInfo) && showDeleteConfirmation && (
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
                  onClick={() => onDelete()}>
                  Confirm
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
        {!isNull(modalInfo) && (
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
        {showGiveAward && postToAward && (
          <GiveAward
            post={postToAward}
            collectionId={collectionId}
            onCancel={() => setShowGiveAward(false)}
            onSuccess={(notificationContent) => {
              setShowGiveAward(false);
              setIsNotificationHidden(false);
              setNotificationContent(notificationContent);
              setTimeout(
                () => setIsNotificationHidden(true),
                NOTIFICATION_BANNER_TIMEOUT
              );
            }}
            onError={(error) => {
              setShowGiveAward(false);
              setModalInfo({
                title: "Something went wrong!",
                type: MessageType.error,
                body: `The award could not be given.`,
                collapsible: { header: "Error", content: error?.message },
              });
            }}
          />
        )}
        <Notification
          hidden={isNotificationHidden}
          content={notificationContent}
          onClose={() => setIsNotificationHidden(true)}
        />
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
              <PermissionsGate
                scopes={[SCOPES.canDeletePost]}
                posterKey={post.poster}>
                <Votes
                  post={post}
                  onDownVotePost={() =>
                    forum.voteDownForumPost(post, collectionId)
                  }
                  onUpVotePost={() => forum.voteUpForumPost(post, collectionId)}
                  updateVotes={(upVoted) => updateVotes(upVoted)}
                />
              </PermissionsGate>
              <PermissionsGate scopes={[SCOPES.canCreateReply]}>
                <div className="actionDivider" />
                <button
                  className="replyButton"
                  disabled={!permission.readAndWrite}
                  onClick={() => setShowReplyBox(true)}>
                  Reply
                </button>
                <button
                  className="awardButton"
                  disabled={!permission.readAndWrite}
                  onClick={() => {
                    setPostToAward(post);
                    setShowGiveAward(true);
                  }}>
                  <Award />
                </button>
              </PermissionsGate>
              <PermissionsGate
                scopes={[SCOPES.canDeletePost]}
                posterKey={post.poster}>
                <div className="actionDivider" />
                <button
                  className="deleteButton"
                  disabled={!permission.readAndWrite}
                  onClick={() => {
                    setPostToDelete(props.post);
                    setShowDeleteConfirmation(true);
                  }}>
                  <Trash />
                </button>
              </PermissionsGate>
            </div>
            <div
              className="repliesSection"
              hidden={replies.length === 0 && !showReplyBox}>
              <div className="repliesBox">
                <PostReplies
                  replies={replies}
                  userRole={userRole}
                  onDeletePost={async (postToDelete) => {
                    setPostToDelete(postToDelete);
                    setShowDeleteConfirmation(true);
                  }}
                  onDownVotePost={(reply) =>
                    forum.voteDownForumPost(reply, collectionId)
                  }
                  onUpVotePost={(reply) =>
                    forum.voteUpForumPost(reply, collectionId)
                  }
                  onReplyClick={() => setShowReplyBox(true)}
                  onAwardReply={(reply) => {
                    setPostToAward(reply);
                    setShowGiveAward(true);
                  }}
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
