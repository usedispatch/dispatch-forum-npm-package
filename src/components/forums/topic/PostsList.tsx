import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Spinner } from "../../common";
import { PostContent } from "../../forums";
import { UserRoleType } from "../../../utils/postbox/userRole";
import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { useForum } from "../../../contexts/DispatchProvider";

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
  const Forum = useForum();
  const { publicKey } = Forum.wallet;

  const emptyList = (
    <div className="emptyList">
      <div className="text">The topic has no comments</div>
    </div>
  );

  return (
    <div className="postListContainer">
      {loading ? (
        <div>
          <div className="spinnerDivider" />
          <Spinner />
        </div>
      ) : posts.length === 0 ? (
        <div>
          <div className="emptyListDivider" />
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
    </div>
  );
}
