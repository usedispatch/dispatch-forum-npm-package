import * as web3 from "@solana/web3.js";
import { useMemo } from "react";
import { ForumPost } from "@usedispatch/client";

import { PostContent } from "../../forums";
import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { UserRoleType } from "../../../utils/permissions";
import { ForumData } from "../../../utils/hooks";
import { selectRepliesFromPosts, sortByVotes } from "../../../utils/posts";

interface PostListProps {
  forum: DispatchForum;
  forumData: ForumData;
  participatingModerators: web3.PublicKey[] | null;
  userRole: UserRoleType;
  update: () => Promise<void>;
  topic: ForumPost;
  onDeletePost: (tx: string) => Promise<void>;
}

export function PostList(props: PostListProps) {
  const { forumData, forum, userRole, onDeletePost, topic, update, participatingModerators } = props;
  const posts = useMemo(() => {
    const posts = selectRepliesFromPosts(forumData.posts, topic);
    return sortByVotes(posts);
  }, [forumData]);

  const emptyList = (
    <div className="emptyList">
      <div className="text">The topic has no comments</div>
    </div>
  );

  return (
    <div className="postListContainer">
      {posts.length === 0
        ? emptyList
        : posts.map((post) => {
            return (
              <div key={`post_${post.postId}`}>
                <PostContent
                  forum={forum}
                  forumData={forumData}
                  post={post}
                  userRole={userRole}
                  topicPosterId={topic.poster}
                  onDeletePost={onDeletePost}
                  update={update}
                  participatingModerators={participatingModerators}
                />
              </div>
            );
          })}
    </div>
  );
}
