import * as _ from "lodash";
import { ReactNode, useMemo, useState } from "react";
import Jdenticon from "react-jdenticon";
import { ForumPost } from "@usedispatch/client";

import { Gift, Trash, Reply, Info } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PermissionsGate,
  PopUpModal,
  Spinner,
  TransactionLink,
} from "./../../common";
import { Votes, Notification } from "../../../components/forums";
import { PostReplies, GiveAward, EditPost, RoleLabel } from "../index";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";
import { SCOPES, UserRoleType } from "../../../utils/permissions";
import {
  ForumData,
  LocalPost,
  isForumPost
} from "../../../utils/hooks";
import { isSuccess } from "../../../utils/loading";
import { selectRepliesFromPosts, sortByVotes } from "../../../utils/posts";

interface PostContentProps {
  forum: DispatchForum;
  forumData: ForumData;
  post: LocalPost | ForumPost;
  userRole: UserRoleType;
  topicPosterId: string;
  update: () => Promise<void>;
  addPost: (post: LocalPost) => void;
  onDeletePost: (tx: string) => Promise<void>;
}

export function PostContent(props: PostContentProps) {
  const { forumData, forum, userRole, topicPosterId, onDeletePost, update, addPost } = props;

  const permission = forum.permission;

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [postToDelete, setPostToDelete] = useState(props.post);
  const [deleting, setDeleting] = useState(false);

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replySize, setReplySize] = useState(
    new Buffer(reply, "utf-8").byteLength
  );

  const [showGiveAward, setShowGiveAward] = useState(false);
  const [postToAward, setPostToAward] = useState<ForumPost>();

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

  const post = useMemo(() => props.post, [props.post]);

  const replies = useMemo(() => {
    if (isForumPost(post)) {
      const replies = selectRepliesFromPosts(forumData.posts, post);
      return sortByVotes(replies);
    } else {
      // If a post is not a ForumPost, it does not have replies
      return [];
    }
  }, [forumData, post]);

  const updateVotes = (upVoted: boolean) => {
    if (isForumPost(post)) {
      if (upVoted) {
        post.upVotes = post.upVotes + 1;
      } else {
        post.downVotes = post.downVotes + 1;
      }
    }
  };

  const onReplyToPost = async () => {
    setSendingReply(true);
    try {
      if (!isForumPost(post)) { return; }
      const tx = await forum.replyToForumPost(post, forumData.collectionId, {
        body: reply,
      });
      setSendingReply(false);
      setShowReplyBox(false);
      setReply("");
      setIsNotificationHidden(false);
      setNotificationContent({
        content: (
          <>
            Replied successfully.
            <TransactionLink transaction={tx!} />
          </>
        ),
        type: MessageType.success,
      });

      const localPost: LocalPost = {
        data: {
          body: reply,
          ts: new Date()
        },
        poster: forum.wallet.publicKey!,
        isTopic: false,
        replyTo: post.address
      };
      addPost(localPost);

      if (tx) {
        await forum.connection.confirmTransaction(tx).then(() => update());
      }
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
      if (!isForumPost(postToDelete)) { return; }
      const tx = await forum.deleteForumPost(
        postToDelete,
        forumData.collectionId,
        userRole === UserRoleType.Moderator
      );
      onDeletePost(tx);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: `The post was deleted`,
      });
      setShowDeleteConfirmation(false);
      if (tx) {
        await forum.connection.confirmTransaction(tx).then(() => update());
      }
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

  const postedAt = `${post.data.ts.toLocaleDateString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })} at ${post.data.ts.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
  })}`;

    // TODO(andrew) reimplement moderator label later
  // const moderators = isSuccess(forumData.moderators)
  //   ? forumData.moderators.map((m) => m.toBase58())
  //   : [];

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
                  onClick={() => onDelete()}>
                  Confirm
                </a>
              )
            }
            onClose={() => setShowDeleteConfirmation(false)}
            // cancelButton={
            //   !deleting && (
            //     <div
            //       className="cancelDeletePostButton"
            //       onClick={() => setShowDeleteConfirmation(false)}
            //     >
            //       Cancel
            //     </div>
            //   )
            // }
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
        {showGiveAward && postToAward && (
          <GiveAward
            post={postToAward}
            collectionId={forumData.collectionId}
            onCancel={() => setShowGiveAward(false)}
            onSuccess={(notificationContent) => {
              setShowGiveAward(false);
              setIsNotificationHidden(false);
              setNotificationContent({
                content: notificationContent,
                type: MessageType.success,
              });
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
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setIsNotificationHidden(true)}
        />
        <>
          <div className="postContentBox">
            <div className="box">
              <div className="postHeader">
                <div className="posterId">
                  <div className="icon">
                    <Jdenticon value={post?.poster.toBase58()} alt="posterID" />
                  </div>
                  <div className="walletId">
                    {post.poster.toBase58()}
                    <RoleLabel
                      topicOwnerId={topicPosterId}
                      posterId={post?.poster.toBase58()}
                    />
                  </div>
                </div>
                <div className="postedAt">
                  Posted at: {postedAt}
                  {isForumPost(post) &&
                  <div className="accountInfo">
                    <a
                      href={`https://solscan.io/account/${post.address}?cluster=${forum.cluster}`}
                      className="transactionLink"
                      target="_blank">
                      <Info />
                    </a>
                  </div>
                  }
                </div>
              </div>
              <div className="postBody">{post?.data.body}</div>
              {isForumPost(post) &&
              <div className="actionsContainer">
                <PermissionsGate scopes={[SCOPES.canVote]}>
                  <Votes
                    post={post}
                    onDownVotePost={() =>
                      forum.voteDownForumPost(post, forumData.collectionId)
                    }
                    onUpVotePost={() =>
                      forum.voteUpForumPost(post, forumData.collectionId)
                    }
                    updateVotes={(upVoted) => updateVotes(upVoted)}
                  />
                </PermissionsGate>
                <EditPost
                  post={post}
                  forumData={forumData}
                  update={() => update()}
                  showDividers={{ leftDivider: true, rightDivider: false }}
                />
                <PermissionsGate scopes={[SCOPES.canCreateReply]}>
                  <div className="right">
                    <PermissionsGate
                      scopes={[SCOPES.canDeletePost]}
                      posterKey={post.poster}>
                      <button
                        className="deleteButton"
                        disabled={!permission.readAndWrite}
                        onClick={() => {
                          setPostToDelete(props.post);
                          setShowDeleteConfirmation(true);
                        }}>
                        <Trash />
                      </button>
                      <div className="actionDivider" />
                    </PermissionsGate>
                    <button
                      className="awardButton"
                      disabled={!permission.readAndWrite}
                      onClick={() => {
                        setPostToAward(post);
                        setShowGiveAward(true);
                      }}>
                      <Gift /> Send Token
                    </button>
                    <div className="actionDivider" />
                    <button
                      className="replyButton"
                      disabled={!permission.readAndWrite}
                      onClick={() => setShowReplyBox(true)}>
                      Reply <Reply />
                    </button>
                  </div>
                </PermissionsGate>
              </div>
              }
            </div>
          </div>
          <div
            className="repliesSection"
            hidden={replies.length === 0 && !showReplyBox}>
            <div className="repliesBox">
              <PostReplies
                forumData={forumData}
                replies={replies}
                userRole={userRole}
                topicOwnerId={topicPosterId}
                update={() => update()}
                onDeletePost={async (postToDelete) => {
                  setPostToDelete(postToDelete);
                  setShowDeleteConfirmation(true);
                }}
                onDownVotePost={(reply) =>
                  forum.voteDownForumPost(reply, forumData.collectionId)
                }
                onUpVotePost={(reply) =>
                  forum.voteUpForumPost(reply, forumData.collectionId)
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
                  <div className="textSize"> {replySize}/800 </div>
                  <div className="buttonsContainer">
                    <button
                      className="cancelReplyButton"
                      onClick={() => {
                        setShowReplyBox(false);
                        new Buffer(reply, "utf-8").byteLength;
                      }}>
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
      </div>
    </>
  );
}
