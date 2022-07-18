import * as _ from "lodash";
import { ReactNode, useEffect, useState } from "react";
import Jdenticon from "react-jdenticon";
import { useRouter } from "next/router";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { MessageSquare, Success, Trash } from "../../../assets";
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
  const isTopicPoster = topic.poster.toBase58() == userPubKey?.toBase58();
  const isAdmin = (userRole == UserRoleType.Owner) || (userRole == UserRoleType.Moderator);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
    okPath?: string;
  } | null>(null);

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
        {(isTopicPoster || isAdmin)  && (
          <>
            <div className="actionDivider" />
            <button
              className="delete"
              disabled={!permission.readAndWrite}
              onClick={() => setShowDeleteConfirmation(true)}>
              <div className="icon">
                <Trash />
              </div>
              delete topic
            </button>
          </>
        )}
      </div>
    </>
  );

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
          setTimeout(() => setIsNotificationHidden(true), 4000);
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
