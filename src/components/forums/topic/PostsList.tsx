import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Spinner } from "../../common";
import { PostContent } from "../../forums";
import { UserRoleType } from "../../../utils/postbox/userRole";
import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { useForum } from "../../../contexts/DispatchProvider";
import { useMemo } from "react";

interface PostListProps {
  forum: DispatchForum;
  collectionId: web3.PublicKey;
  posts: ForumPost[];
  loading: boolean;
  userRole: UserRoleType;
  onDeletePost: () => Promise<void>;
}

export function PostList(props: PostListProps) {
  const { collectionId, forum, loading, userRole, onDeletePost } = props;
  const Forum = useForum();
  const { publicKey } = Forum.wallet;
  const isAdmin = (userRole == UserRoleType.Owner) || (userRole == UserRoleType.Moderator);

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
          const deletePermission = publicKey
            ? publicKey.toBase58() === post.poster.toBase58() ||
              isAdmin
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
    </div>
  );
}
