import * as _ from "lodash";
import { ReactNode, useEffect, useState } from "react";
import Jdenticon from "react-jdenticon";
import { useRouter } from "next/router";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { MessageSquare, Trash } from "../../assets";
import { MessageType, PopUpModal, Spinner } from "../common";
import { CreatePost, PostList } from "./";

import { DispatchForum } from "../../utils/postbox/postboxWrapper";
import { UserRoleType } from "../../utils/postbox/userRole";

interface TopicContentProps {
  forum: DispatchForum;
  topic: ForumPost;
  collectionId: web3.PublicKey;
  userRole: UserRoleType;
}

export function TopicContent(props: TopicContentProps) {
  const { collectionId, forum, topic, userRole } = props;
  const router = useRouter();

  const [loadingMessages, setLoadingMessages] = useState(true);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
  } | null>(null);

  const getMessages = async () => {
    setLoadingMessages(true);
    try {
      const data = await forum.getTopicMessages(topic.postId, collectionId);
      setPosts(data ?? []);
      setLoadingMessages(false);
    } catch (error) {
      setPosts([]);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The messages could not be loaded`,
      });
      setLoadingMessages(false);
    }
  };

  const onDeletePost = async (post: ForumPost) => {
    const tx = await forum.deleteForumPost(
      post,
      collectionId,
      userRole === UserRoleType.Moderator
    );
    await getMessages();
    return tx;
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
        body: `The topic and all its posts were deleted`,
      });
      setShowDeleteConfirmation(false);
      setDeletingTopic(false);
      return tx;
    } catch (error) {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The topic could not be deleted`,
      });
      setDeletingTopic(false);
      setShowDeleteConfirmation(false);
    }
  };

  useEffect(() => {
    if (topic && collectionId) {
      getMessages();
    } else {
      setLoadingMessages(false);
    }
  }, [topic, collectionId]);

  const data = (
    <>
      <div className="data">
        <div className="commentsContainer">
          <div className="image">
            {/* <Image src={msgSquare} height={12} width={12} alt="delete" /> */}
            <MessageSquare />
          </div>
          {`${posts.length} comments`}
        </div>
        {(userRole === UserRoleType.Moderator ||
          userRole === UserRoleType.Owner) && (
          <div
            className="delete"
            onClick={() => setShowDeleteConfirmation(true)}>
            <div className="icon">
              {/* <Image src={trash} height={16} width={16} alt="delete" /> */}
              <Trash />
            </div>
            delete topic
          </div>
        )}
      </div>
      <div className="border-t border-gray-400 mt-3 pb-8" />
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
          okButton={
            <a
              className="okInfoButton"
              onClick={() => {
                if (modalInfo.type === MessageType.success) {
                  router.push(`/forum/${collectionId.toBase58()}`);
                  setModalInfo(null);
                } else {
                  setModalInfo(null);
                }
              }}>
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
            deletingTopic ? (
              <div className="deleteSpinner">
                <Spinner />
              </div>
            ) : (
              "This is permanent and you won't be able to access this topic again. All the posts here will be deleted too."
            )
          }
          okButton={
            !deletingTopic && (
              <a className="acceptDeleteTopicButton" onClick={onDeleteTopic}>
                Accept
              </a>
            )
          }
          cancelButton={
            !deletingTopic && (
              <div
                className="cancelDeleteTopicButton"
                onClick={() => setShowDeleteConfirmation(false)}>
                Cancel
              </div>
            )
          }
        />
      )}
      <TopicHeader topic={topic} />
      {data}
      <CreatePost
        topicId={topic.postId}
        collectionId={collectionId}
        createForumPost={forum.createForumPost}
        onReload={() => getMessages()}
      />
      <PostList
        forum={forum}
        collectionId={collectionId}
        posts={posts}
        loading={loadingMessages}
        onDeletePost={onDeletePost}
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
