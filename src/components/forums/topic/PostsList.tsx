import * as web3 from "@solana/web3.js";
import { useMemo } from "react";
import { ForumPost } from "@usedispatch/client";

import { Spinner } from "../../common";
import { PostContent } from "../../forums";
import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { UserRoleType } from "../../../utils/permissions";
import { ForumData } from '../../../utils/hooks';
import { selectReplies } from '../../../utils/posts';

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
    const posts = selectReplies(forumData.posts, topic);
    // TODO(andrew) refactor this sort into a helper function
    return posts.sort((left, right) => {
      const leftVotes = left.upVotes - left.downVotes;
      const rightVotes = right.upVotes - right.downVotes;
      return rightVotes - leftVotes;
    });
  }, [forumData]);

  const emptyList = (
    <div className="emptyList">
      <div className="text">The topic has no comments</div>
    </div>
  );

  return (
    <div className="postListContainer">
      {posts.length === 0 ?
        emptyList :
        posts.map((post) => {

          return (
            <div key={`post_${post.postId}`}>
              <PostContent
                forum={forum}
                forumData={forumData}
                post={post}
                onDeletePost={onDeletePost}
                update={update}
                userRole={userRole}
              />
            </div>
          );
        })}
    </div>
  );
}
