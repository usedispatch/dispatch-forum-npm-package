import * as _ from "lodash";
import { ReactNode, useEffect, useMemo, useState } from "react";
import Jdenticon from "react-jdenticon";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Lock, MessageSquare, Success, Trash } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  TransactionLink,
} from "../../common";
import { CreatePost, PostList } from "..";
import { Notification, Votes } from "..";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { UserRoleType } from "../../../utils/postbox/userRole";
import { newPublicKey } from "../../../utils/postbox/validateNewPublicKey";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";

import { useForum, usePath } from "../../../contexts/DispatchProvider";

interface TopicContentProps {
  forum: DispatchForum;
  topic: ForumPost;
  collectionId: web3.PublicKey;
  userRole: UserRoleType;
  updateVotes: (upVoted: boolean) => void;
}

export function TopicContent(props: TopicContentProps) {
  const { collectionId, forum, topic, userRole, updateVotes } = props;
  const { buildForumPath } = usePath();
  const forumPath = buildForumPath(collectionId.toBase58());
  const permission = forum.permission;
  const Forum = useForum();
  const userPubKey = Forum.wallet.publicKey;

  const [loadingMessages, setLoadingMessages] = useState(true);
  const [posts, setPosts] = useState<ForumPost[]>([]);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(false);

  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const [notificationContent, setNotificationContent] = useState<
    string | ReactNode
  >("");

  const [showAddAccessToken, setShowAddAccessToken] = useState(false);
  const [accessToken, setAccessToken] = useState<string>();
  const [addingAccessToken, setAddingAccessToken] = useState(false);
  const [accessToPost, setAccessToPost] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
    okPath?: string;
  } | null>(null);

  const isTopicPoster = topic.poster.toBase58() == userPubKey?.toBase58();
  const isAdmin =
    userRole == UserRoleType.Owner || userRole == UserRoleType.Moderator;

  const getMessages = async () => {
    setLoadingMessages(true);
    try {
      const data = await forum.getTopicMessages(topic.postId, collectionId);
      setPosts(data ?? []);
      setLoadingMessages(false);
    } catch (error) {
      setPosts([]);
      const message = JSON.stringify(error);
      console.log(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The messages could not be loaded`,
        collapsible: { header: "Error", content: message },
      });
      setLoadingMessages(false);
    }
  };

  const addAccessToken = async () => {
    setAddingAccessToken(true);
    try {
      const token = newPublicKey(accessToken!);

      const tx = await Forum.setForumPostRestriction(collectionId, {
        tokenOwnership: { mint: token, amount: 5000 },
      });

      setAccessToken("");
      setShowAddAccessToken(false);
      setAddingAccessToken(false);
      setAccessToken(undefined);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>The access token was added</div>
            <TransactionLink transaction={tx} />
          </div>
        ),
      });
    } catch (error: any) {
      setAddingAccessToken(false);
      if (error.code !== 4001) {
        setAccessToken("");
        setShowAddAccessToken(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The access token could not be added`,
          collapsible: { header: "Error", content: JSON.stringify(error) },
        });
      }
    }
  };

  const onDeleteTopic = async () => {
    try {
      setDeletingTopic(true);
      const tx = await forum.deleteForumPost(
        topic,
        collectionId,
        userRole === UserRoleType.Moderator
      );
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>The topic and all its posts were deleted</div>
            <TransactionLink transaction={tx} />
          </div>
        ),
        okPath: forumPath,
      });
      setShowDeleteConfirmation(false);
      setDeletingTopic(false);
      return tx;
    } catch (error: any) {
      setDeletingTopic(false);
      setShowDeleteConfirmation(false);
      if (error.code === 4001) {
        setModalInfo({
          title: "The topic could not be deleted",
          type: MessageType.error,
          body: `The user cancelled the request`,
        });
      } else {
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The topic could not be deleted`,
          collapsible: { header: "Error", content: JSON.stringify(error) },
        });
      }
    }
  };

  useEffect(() => {
    getMessages();
  }, [topic, collectionId]);

  const data = (
    <>
      <div className="data">
        <div className="commentsContainer">
          <div className="image">
            <MessageSquare />
          </div>
          {`${posts.length} comments`}
        </div>
        <div className="actionDivider" />
        <Votes
          onDownVotePost={() => forum.voteDownForumPost(topic, collectionId)}
          onUpVotePost={() => forum.voteUpForumPost(topic, collectionId)}
          post={topic}
          updateVotes={(upVoted) => updateVotes(upVoted)}
        />
        {isAdmin && (
          <>
            <div className="actionDivider" />
            <div className="moderatorToolsContainer">
              <div>Moderator tools: </div>
              <button
                className="moderatorTool"
                disabled={!permission.readAndWrite}
                onClick={() => setShowDeleteConfirmation(true)}>
                <div className="delete">
                  <Trash />
                </div>
                delete topic
              </button>
              <button
                className="moderatorTool"
                disabled={!permission.readAndWrite}
                onClick={() => setShowAddAccessToken(true)}>
                <div className="lock">
                  <Lock />
                </div>
                manage post access
              </button>
            </div>
          </>
        )}
        {isTopicPoster && !isAdmin && (
          <>
            <div className="actionDivider" />
            <button
              className="moderatorTool deleteButton"
              disabled={!permission.readAndWrite}
              onClick={() => setShowDeleteConfirmation(true)}>
              <div className="delete">
                <Trash />
              </div>
              delete topic
            </button>
          </>
        )}
      </div>
    </>
  );

  const canPostOnTopic = async () => {
    const canPost = await Forum.canPost(collectionId, topic);
    setAccessToPost(permission.readAndWrite && canPost);
  };

  useEffect(() => {
    canPostOnTopic();
  }, [collectionId, permission.readAndWrite]);

  return (
    <>
      {!_.isNil(modalInfo) && (
        <PopUpModal
          id="topic-info"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          collapsible={modalInfo.collapsible}
          okButton={
            <a
              className="okButton"
              href={modalInfo.okPath}
              onClick={() => setModalInfo(null)}>
              OK
            </a>
          }
        />
      )}
      {showAddAccessToken && _.isNil(modalInfo) && (
        <PopUpModal
          id="add-access-token"
          visible
          title="Limit post access"
          body={
            <div className="">
              You can enter one token mint ID here such that only holders of
              this token can participate in this topic. This mint can be for any
              spl-token, eg SOL, NFTs, etc.
              <input
                type="text"
                placeholder="Token mint ID"
                className="newAccessToken"
                name="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>
          }
          loading={addingAccessToken}
          onClose={() => setShowAddAccessToken(false)}
          okButton={
            <button
              className="okButton"
              disabled={accessToken?.length === 0}
              onClick={() => addAccessToken()}>
              Save
            </button>
          }
          cancelButton={
            <button
              className="cancelDeleteTopicButton"
              onClick={() => setShowAddAccessToken(false)}>
              Cancel
            </button>
          }
        />
      )}
      {showDeleteConfirmation && (
        <PopUpModal
          id="topic-delete-confirmation"
          visible
          title="Are you sure you want to delete this topic?"
          body={
            "This is permanent and you won't be able to access this topic again. All the posts here will be deleted too."
          }
          loading={deletingTopic}
          okButton={
            <a className="acceptDeleteTopicButton" onClick={onDeleteTopic}>
              Confirm
            </a>
          }
          cancelButton={
            <div
              className="cancelDeleteTopicButton"
              onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </div>
          }
        />
      )}
      <div className="topicContentBox">
        <TopicHeader topic={topic} />
        {data}
        <CreatePost
          topicId={topic.postId}
          collectionId={collectionId}
          hasAccess={accessToPost}
          createForumPost={forum.createForumPost}
          onReload={() => getMessages()}
        />
      </div>
      <Notification
        hidden={isNotificationHidden}
        content={notificationContent}
        onClose={() => setIsNotificationHidden(true)}
      />
      <PostList
        forum={forum}
        collectionId={collectionId}
        posts={posts}
        loading={loadingMessages}
        onDeletePost={async (tx) => {
          setIsNotificationHidden(false);
          setNotificationContent(
            <>
              <Success />
              Post deleted successfully.
              <TransactionLink transaction={tx} />
            </>
          );
          setTimeout(
            () => setIsNotificationHidden(true),
            NOTIFICATION_BANNER_TIMEOUT
          );
          await getMessages();
        }}
        userRole={userRole}
      />
    </>
  );
}

interface TopicHeaderProps {
  topic: ForumPost;
}

function TopicHeader(props: TopicHeaderProps) {
  const { topic } = props;

  const postedAt = topic
    ? `${topic.data.ts.toLocaleDateString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })} at ${topic.data.ts.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
      })}`
    : "-";

  return (
    <div className="topicHeader">
      <div className="topicTitle">
        <div className="left">
          <div className="subj">{topic?.data.subj ?? "subject"}</div>
          <div className="poster">
            <div className="icon">
              <Jdenticon value={topic?.poster.toBase58()} alt="posterID" />
            </div>
            <div className="posterId">{topic?.poster.toBase58()}</div>
          </div>
        </div>
        <div className="postedAt">Posted at: {postedAt}</div>
      </div>
      <div className="topicBody">{topic?.data.body ?? "body of the topic"}</div>
    </div>
  );
}
