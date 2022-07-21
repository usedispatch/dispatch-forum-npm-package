import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Spinner } from "../../common";
import { PostContent } from "../../forums";
import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { useMemo } from "react";

import { UserRoleType } from "../../../utils/permissions";
interface PostListProps {
  forum: DispatchForum;
  collectionId: web3.PublicKey;
  posts: ForumPost[];
  loading: boolean;
  userRole: UserRoleType;
  onDeletePost: (tx: string) => Promise<void>;
}

export function PostList(props: PostListProps) {
  const { collectionId, forum, loading, userRole, onDeletePost } = props;

  const emptyList = (
    <div className="emptyList">
      <div className="text">The topic has no comments</div>
    </div>
  );

  const posts = useMemo(
    () => props.posts.sort((a, b) => b.data.ts.valueOf() - a.data.ts.valueOf()),
    [props.posts]
  );

  return (
    <div className="postListContainer">
      {loading ? (
        <div className="postListSpinnerContainer">
          <Spinner />
        </div>
      ) : posts.length === 0 ? (
        emptyList
      ) : (
        posts.map((post) => {

          return (
            <div key={`post_${post.postId}`}>
              <PostContent
                forum={forum}
                collectionId={collectionId}
                post={post}
                onDeletePost={onDeletePost}
                userRole={userRole}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
