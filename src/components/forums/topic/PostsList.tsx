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
  userRole: UserRoleType;
  update: () => Promise<void>;
  topic: ForumPost;
  onDeletePost: (tx: string) => Promise<void>;
}

export function PostList(props: PostListProps) {
  const { forumData, forum, userRole, onDeletePost, topic, update } = props;
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
              // HACK: Use the timestring for key value here because the postId and address may not be present on `LocalPost`s
              <div key={`post_${post.data.ts.toLocaleTimeString()}`}>
                <PostContent
                  forum={forum}
                  forumData={forumData}
                  post={post}
                  userRole={userRole}
                  topicPosterId={topic.poster.toBase58()}
                  onDeletePost={onDeletePost}
                  update={update}
                />
              </div>
            );
          })}
    </div>
  );
}
