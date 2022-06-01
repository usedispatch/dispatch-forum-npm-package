import * as _ from "lodash";
import { ReactNode, useEffect, useState } from "react";
import Image from "utils/image";
import Jdenticon from "react-jdenticon";
import * as web3 from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { ForumPost } from "@usedispatch/client";

import { trash } from "assets";
import { MessageType, PopUpModal, Spinner } from "components/common";
import { PostReplies } from "components/forums";

import { UserRoleType } from "utils/postbox/userRole";
import { DispatchForum } from "utils/postbox/postboxWrapper";

interface PostListProps {
  forum: DispatchForum;
  collectionId: web3.PublicKey;
  posts: ForumPost[];
  loading: boolean;
  userRole: UserRoleType;
  onDeletePost: (post: ForumPost) => Promise<string>;
}

export function PostList(props: PostListProps) {
  const { collectionId, forum, loading, posts, userRole, onDeletePost } = props;
  const { publicKey } = useWallet();

  const emptyList = (
    <div className="flex flex-col items-center">
      <div className="text-center text-xl font-medium w-[650px] pt-7 font-raleway">
        The topic has no comments
      </div>
    </div>
  );

  return (
    <>
      {loading ? (
        <div>
          <div className="border-t border-gray-400 mt-3 mb-8" />
          <Spinner />
        </div>
      ) : posts.length === 0 ? (
        <div>
          <div className="border-t border-gray-400 mt-3" />
          {emptyList}
        </div>
      ) : (
        posts.map((post) => {
          const deletePermission = publicKey
            ? publicKey.toBase58() === post.poster.toBase58() ||
              userRole === UserRoleType.Moderator
            : false;

          return (
            <div key={`post_${post.postId}`}>
              <PostContent
                forum={forum}
                collectionId={collectionId}
                post={post}
                onDeletePost={onDeletePost}
                deletePermission={deletePermission}
                userRole={userRole}
              />
            </div>
          );
        })
      )}
    </>
  );
}

interface PostContentProps {
  forum: DispatchForum;
  collectionId: web3.PublicKey;
  post: ForumPost;
  deletePermission: boolean;
  userRole: UserRoleType;
  onDeletePost: (post: ForumPost) => Promise<string>;
}

function PostContent(props: PostContentProps) {
  const {
    collectionId,
    deletePermission,
    forum,
    post,
    userRole,
    onDeletePost,
  } = props;

  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState<ForumPost[]>([]);
  const [deleting, setDeleting] = useState(false);
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

  const onReplyToPost = async (post: ForumPost, reply: string) => {
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
      console.log(error);
      setSendingReply(false);
    }
  };

  const onDelete = async () => {
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
      <div className="font-raleway h-auto my-6">
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
                onClick={onDelete}
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
              className="border border-gray-800 rounded-full flex items-center w-8 h-6 max-h-6 p-2 mr-2"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              <Image src={trash} height={18} width={18} alt="delete" />
            </button>
          )}
          <button
            className="normal-case border border-gray-800 rounded-full text-xs flex items-center h-6 max-h-6 p-2 mr-2"
            onClick={() => setShowReplyBox(!showReplyBox)}
          >
            Reply
          </button>
        </div>
        <div className="mt-3 pl-6 border-l border-gray-400">
          {replies.length > 0 && (
            <div className="pl-1">
              <PostReplies post={post} replies={replies} loading={loading} />
            </div>
          )}
          {showReplyBox &&
            (sendingReply ? (
              <Spinner />
            ) : (
              <div className="flex flex-col items-end mt-6 mb-14">
                <textarea
                  placeholder="Type your reply here"
                  className="input input-bordered h-36 w-full mt-1 border-gray-400 placeholder-gray-400 rounded-2xl"
                  maxLength={800}
                  value={reply}
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
                    onClick={() => onReplyToPost(post, reply)}
                  >
                    Reply
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
