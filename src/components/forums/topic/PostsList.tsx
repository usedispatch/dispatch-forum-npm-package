import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { ForumPost } from "@usedispatch/client";

import { PostContent } from "../../forums";
import { DispatchForum } from '@postbox';
import { UserRoleType } from '@utils';
import {
  ForumData,
  CreatedPost
} from '@types';
import { selectRepliesFromPosts, sortByVotes } from "../../../utils/posts";

interface PostListProps {
  forum: DispatchForum;
  forumData: ForumData;
  participatingModerators: PublicKey[] | null;
  userRoles: UserRoleType[];
  update: () => Promise<void>;
  addPost: (post: CreatedPost) => void;
  editPost: (post: ForumPost, newText: string) => void;
  deletePost: (post: ForumPost) => void;
  topic: ForumPost;
  onDeletePost: (tx: string) => Promise<void>;
  postInFlight: boolean;
  setPostInFlight: (postInFlight: boolean) => void;
}

export function PostList(props: PostListProps) {
  const {
    forumData,
    forum,
    userRoles,
    onDeletePost,
    topic,
    update,
    editPost,
    addPost,
    deletePost,
    postInFlight,
    setPostInFlight,
    participatingModerators,
  } = props;
  const posts = useMemo(() => {
    const posts = selectRepliesFromPosts(forumData.posts, topic);
    return sortByVotes(posts);
  }, [forumData]);

  const emptyList = (
    <div className="emptyPostsList">
      <div className="text">The topic has no comments</div>
    </div>
  );

  return (
    <div className="postListContainer">
      {posts.length === 0
        ? emptyList
        : posts.map((post) => {
            return (
              // HACK: Use the timestring for key value here because the postId and address may not be present on `LocalPost`s
              <div key={`post_${post.data.ts.toLocaleTimeString()}`}>
                <PostContent
                  forum={forum}
                  forumData={forumData}
                  post={post}
                  userRoles={userRoles}
                  topicPosterId={topic.poster}
                  onDeletePost={onDeletePost}
                  update={update}
                  participatingModerators={participatingModerators}
                  addPost={addPost}
                  editPost={editPost}
                  deletePost={deletePost}
                  postInFlight={postInFlight}
                  setPostInFlight={setPostInFlight}
                />
              </div>
            );
          })}
    </div>
  );
}
