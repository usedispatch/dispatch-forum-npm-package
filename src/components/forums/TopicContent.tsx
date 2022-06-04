import * as _ from "lodash";
import { ReactNode, useEffect, useState } from "react";
import Jdenticon from "react-jdenticon";
import Image from "../../utils/image";
import { useRouter } from "next/router";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { msgSquare, trash } from "assets";
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
      <div className="flex justify-start font-raleway font-light text-xs text-gray-800">
        <div className="flex items-center mr-8 cursor-default">
          <div className="h-3 mr-1">
            <Image src={msgSquare} height={12} width={12} alt="delete" />
          </div>
          {`${posts.length} comments`}
        </div>
        {(userRole === UserRoleType.Moderator ||
          userRole === UserRoleType.Owner) && (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => setShowDeleteConfirmation(true)}
          >
            <div className="mr-1">
              <Image src={trash} height={16} width={16} alt="delete" />
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
      {!_.isNull(modalInfo) && (
        <PopUpModal
          id="topic-info"
          visible={!_.isNull(modalInfo)}
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          okButton={
            <a
              className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white border-2"
              onClick={() => {
                if (modalInfo.type === MessageType.success) {
                  router.push(`/forum/${collectionId.toBase58()}`);
                  setModalInfo(null);
                } else {
                  setModalInfo(null);
                }
              }}
            >
              OK
            </a>
          }
        />
      )}
      <PopUpModal
        id="topic-delete-confirmation"
        visible={showDeleteConfirmation}
        title="Are you sure you want to delete this topic?"
        body={
          deletingTopic ? (
            <div className="flex items-center justify-center pt-6 m-auto">
              <Spinner />
            </div>
          ) : (
            "This is permanent and you won't be able to access this topic again. All the posts here will be deleted too."
          )
        }
        okButton={
          !deletingTopic && (
            <a
              className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white border-2"
              onClick={onDeleteTopic}
            >
              Accept
            </a>
          )
        }
        cancelButton={
          !deletingTopic && (
            <div
              className="btn btn-secondary border-2 hover:opacity-75 hover:bg-gray-200"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              Cancel
            </div>
          )
        }
      />
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
    <div className="font-raleway h-auto mt-4 mb-10">
      <div className="flex items-start justify-between pb-10">
        <div className="flex flex-col">
          <div className="font-semibold text-xl pb-5">
            {topic?.data.subj ?? "subject"}
          </div>
          <div className="flex items-center">
            <div className="h-7 w-7 mr-1">
              <Jdenticon
                className="h-7 w-7"
                value={topic?.poster.toBase58()}
                alt="posterID"
              />
            </div>
            <div className="text-sm font-normal">
              {topic?.poster.toBase58()}
            </div>
          </div>
        </div>
        <div className="text-xs font-light">Posted at: {postedAt}</div>
      </div>
      <div className="text-sm min-h-[120px]">
        {topic?.data.body ?? "body of the topic"}
      </div>
    </div>
  );
}
