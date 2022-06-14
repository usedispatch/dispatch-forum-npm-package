import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Spinner } from "../common";
import { PostContent } from "../forums";
import { UserRoleType } from "../../utils/postbox/userRole";
import { DispatchForum } from "../../utils/postbox/postboxWrapper";
import { useForum } from "../../contexts/DispatchProvider";

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
